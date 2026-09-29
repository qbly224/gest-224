import "server-only";
import { prisma } from "@/lib/prisma";
import { envoyerEmail } from "@/lib/email";
import { formatEuros, formatDate } from "@/lib/format";

const DELAI_MIN_ENTRE_RELANCES_MS = 24 * 60 * 60 * 1000;

const BASE_PATH: Record<"facture" | "facture_acompte", string> = {
  facture: "/factures",
  facture_acompte: "/factures-acompte",
};

/**
 * Envoie une relance par email pour chaque facture (ou facture d'acompte) en
 * retard de paiement, au plus une fois par 24h et par facture. Destinée à
 * être appelée par un job planifié externe (cf.
 * app/api/cron/relances/route.ts), jamais par une action utilisateur : elle
 * parcourt tous les tenants, pas un seul.
 */
export async function envoyerRelancesFacturesEnRetard(): Promise<{
  examinees: number;
  envoyees: number;
  ignorees: number;
}> {
  const maintenant = new Date();
  const seuilRelance = new Date(maintenant.getTime() - DELAI_MIN_ENTRE_RELANCES_MS);

  const factures = await prisma.document.findMany({
    where: {
      type: { in: ["facture", "facture_acompte"] },
      statut: "envoye",
      dateEcheance: { lt: maintenant },
      tenant: { actif: true, relancesActivees: true },
      OR: [{ dernierRappelEnvoyeAt: null }, { dernierRappelEnvoyeAt: { lt: seuilRelance } }],
    },
    include: {
      tenant: { select: { raisonSociale: true, email: true } },
      client: { select: { email: true } },
    },
  });

  let envoyees = 0;
  let ignorees = 0;

  for (const facture of factures) {
    if (!facture.client.email) {
      ignorees++;
      continue;
    }

    const lien = `${process.env.APP_URL ?? "https://gest-224.onrender.com"}${
      BASE_PATH[facture.type as "facture" | "facture_acompte"]
    }/${facture.id}`;

    try {
      await envoyerEmail(
        facture.client.email,
        `Rappel — facture ${facture.numero} en retard de paiement`,
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

  return { examinees: factures.length, envoyees, ignorees };
}
