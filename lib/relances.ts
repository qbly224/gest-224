import "server-only";
import { prisma } from "@/lib/prisma";
import { envoyerEmail } from "@/lib/email";
import { formatEuros, formatDate } from "@/lib/format";
import { SITE_URL } from "@/lib/site-url";

const BASE_PATH: Record<"facture" | "facture_acompte", string> = {
  facture: "/factures",
  facture_acompte: "/factures-acompte",
};

/**
 * Envoie une relance par email pour chaque facture (ou facture d'acompte) en
 * retard de paiement, au plus une fois par facture selon la fréquence
 * propre à chaque client (client.relanceIntervalleJours, désactivable par
 * client via client.relancesActivees - cf. lib/actions/clients.ts) ;
 * l'interrupteur général du tenant (tenant.relancesActivees) reste
 * prioritaire. Destinée à être appelée par un job planifié externe (cf.
 * app/api/cron/relances/route.ts), jamais par une action utilisateur : elle
 * parcourt tous les tenants, pas un seul.
 *
 * Le filtrage par seuil se fait en mémoire (pas dans le where Prisma) car
 * le délai minimal entre deux relances dépend du client, donc varie d'une
 * ligne à l'autre - impossible à exprimer en une seule comparaison SQL.
 */
export async function envoyerRelancesFacturesEnRetard(): Promise<{
  examinees: number;
  envoyees: number;
  ignorees: number;
}> {
  const maintenant = new Date();

  const candidates = await prisma.document.findMany({
    where: {
      type: { in: ["facture", "facture_acompte"] },
      statut: "envoye",
      dateEcheance: { lt: maintenant },
      tenant: { actif: true, relancesActivees: true },
      client: { relancesActivees: true },
    },
    include: {
      tenant: { select: { raisonSociale: true, email: true } },
      client: { select: { email: true, relanceIntervalleJours: true } },
    },
  });

  const factures = candidates.filter((facture) => {
    if (!facture.dernierRappelEnvoyeAt) return true;
    const seuil = new Date(
      maintenant.getTime() - facture.client.relanceIntervalleJours * 24 * 60 * 60 * 1000
    );
    return facture.dernierRappelEnvoyeAt < seuil;
  });

  let envoyees = 0;
  let ignorees = 0;

  for (const facture of factures) {
    if (!facture.client.email) {
      ignorees++;
      continue;
    }

    const lien = `${SITE_URL}${
      BASE_PATH[facture.type as "facture" | "facture_acompte"]
    }/${facture.id}`;

    try {
      await envoyerEmail(
        facture.client.email,
        `Rappel - facture ${facture.numero} en retard de paiement`,
        `Bonjour,\n\n` +
          `Sauf erreur de notre part, la facture n° ${facture.numero} d'un montant de ` +
          `${formatEuros(Number(facture.montantTtc), "fr")} TTC, émise par ${facture.tenant.raisonSociale}, ` +
          `était due le ${formatDate(facture.dateEcheance!, "fr")} et reste impayée à ce jour.\n\n` +
          `Merci de bien vouloir procéder à son règlement dans les meilleurs délais. ` +
          `N'hésitez pas à nous contacter en cas de difficulté ou si ce message a croisé votre paiement.\n\n` +
          `Cordialement,\n${facture.tenant.raisonSociale}\n\n` +
          `Référence : ${lien}`
      );
      await prisma.document.update({
        where: { id: facture.id },
        data: { dernierRappelEnvoyeAt: maintenant },
      });
      envoyees++;
    } catch (err) {
      console.error(`[relances] Échec de l'envoi pour la facture ${facture.numero}:`, err);
      ignorees++;
    }
  }

  return { examinees: candidates.length, envoyees, ignorees };
}
