import "server-only";
import { prisma } from "@/lib/prisma";
import { envoyerEmail } from "@/lib/email";

/**
 * Prochaine échéance du 5 du mois à partir de `depuis` : le 5 du même mois
 * si `depuis` tombe le 5 ou avant, sinon le 5 du mois suivant. Sert de
 * délai de grâce après un premier échec de paiement récurrent (cf.
 * Tenant.paiementEnEchecDepuis) - jamais moins de quelques jours, jamais
 * plus d'un mois.
 */
export function prochainCinqDuMois(depuis: Date): Date {
  const cinqCeMois = new Date(depuis.getFullYear(), depuis.getMonth(), 5, 0, 0, 0, 0);
  if (depuis.getDate() <= 5) return cinqCeMois;
  return new Date(depuis.getFullYear(), depuis.getMonth() + 1, 5, 0, 0, 0, 0);
}

/**
 * Enregistre un échec de paiement récurrent et envoie une relance par
 * email - appelée à chaque webhook Stripe invoice.payment_failed (un par
 * tentative de relance Stripe). Ne bloque rien elle-même : seule
 * bloquerAbonnementsEnEchec() (job planifié) le fait, une fois le délai
 * de grâce dépassé.
 */
export async function enregistrerEchecPaiement(tenantId: string): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { raisonSociale: true, paiementEnEchecDepuis: true },
  });
  if (!tenant) return;

  if (!tenant.paiementEnEchecDepuis) {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { paiementEnEchecDepuis: new Date() },
    });
  }

  const proprietaire = await prisma.user.findFirst({
    where: { tenantId, role: "owner" },
    select: { email: true },
  });
  if (!proprietaire) return;

  try {
    await envoyerEmail(
      proprietaire.email,
      "Échec de votre dernier paiement UniGest",
      `Le dernier prélèvement pour l'abonnement de ${tenant.raisonSociale} a échoué.\n\n` +
        `Mettez à jour votre moyen de paiement depuis la page Abonnement avant le 5 du mois pour ` +
        `éviter que votre compte ne passe en lecture seule (création de nouveaux éléments bloquée, ` +
        `historique toujours consultable).`
    );
  } catch (err) {
    console.error("[paiement-echec] Échec de l'envoi de la relance:", err);
  }
}

/** Efface l'échec en cours et redonne l'accès complet - webhook invoice.payment_succeeded. */
export async function resoudreEchecPaiement(tenantId: string): Promise<void> {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { paiementEnEchecDepuis: null, paiementValide: true },
  });
}

/**
 * Bascule paiementValide à false pour tout tenant dont le délai de grâce
 * (prochainCinqDuMois) est dépassé et dont le paiement est toujours en
 * échec. Destinée à un job planifié quotidien (cf.
 * app/api/cron/paiements-en-echec/route.ts), jamais à une action
 * utilisateur.
 */
export async function bloquerAbonnementsEnEchec(): Promise<{
  examines: number;
  bloques: number;
}> {
  const maintenant = new Date();
  const candidats = await prisma.tenant.findMany({
    where: {
      paiementEnEchecDepuis: { not: null },
      paiementValide: true,
      plan: { not: "gratuit" },
    },
    select: { id: true, paiementEnEchecDepuis: true },
  });

  let bloques = 0;
  for (const tenant of candidats) {
    if (maintenant >= prochainCinqDuMois(tenant.paiementEnEchecDepuis!)) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { paiementValide: false },
      });
      bloques += 1;
    }
  }

  return { examines: candidats.length, bloques };
}
