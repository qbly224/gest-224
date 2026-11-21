import "server-only";
import { prisma } from "@/lib/prisma";
import { envoyerEmail } from "@/lib/email";
import { formatEuros, formatDate } from "@/lib/format";
import { SITE_URL } from "@/lib/site-url";

/**
 * Envoie une relance par email pour chaque cotisation en retard de
 * paiement, au plus une fois par cotisation selon la fréquence propre à
 * chaque membre (membre.relanceIntervalleJours, désactivable par membre
 * via membre.relancesActivees - cf. lib/actions/membres.ts) ; l'interrupteur
 * général du tenant (tenant.relancesActivees, partagé avec les relances de
 * factures) reste prioritaire. Une cotisation sans date d'échéance n'est
 * jamais relancée. Destinée à être appelée par un job planifié externe
 * (cf. app/api/cron/relances-cotisations/route.ts), jamais par une action
 * utilisateur : elle parcourt tous les tenants, pas un seul.
 *
 * Le filtrage par seuil se fait en mémoire (comme pour les factures,
 * lib/relances.ts) car le délai minimal entre deux relances dépend du
 * membre, donc varie d'une ligne à l'autre.
 */
export async function envoyerRelancesCotisationsEnRetard(): Promise<{
  examinees: number;
  envoyees: number;
  ignorees: number;
}> {
  const maintenant = new Date();

  const candidates = await prisma.cotisation.findMany({
    where: {
      datePaiement: null,
      dateEcheance: { not: null, lt: maintenant },
      tenant: { actif: true, relancesActivees: true },
      membre: { relancesActivees: true },
    },
    include: {
      tenant: { select: { raisonSociale: true } },
      membre: { select: { prenom: true, nom: true, email: true, relanceIntervalleJours: true } },
    },
  });

  const cotisations = candidates.filter((cotisation) => {
    if (!cotisation.dernierRappelEnvoyeAt) return true;
    const seuil = new Date(
      maintenant.getTime() - cotisation.membre.relanceIntervalleJours * 24 * 60 * 60 * 1000
    );
    return cotisation.dernierRappelEnvoyeAt < seuil;
  });

  let envoyees = 0;
  let ignorees = 0;

  for (const cotisation of cotisations) {
    if (!cotisation.membre.email) {
      ignorees++;
      continue;
    }

    const lien = `${SITE_URL}/cotisations/${cotisation.id}`;

    try {
      await envoyerEmail(
        cotisation.membre.email,
        `Rappel - cotisation ${cotisation.periode} en retard de paiement`,
        `Bonjour ${cotisation.membre.prenom},\n\n` +
          `Sauf erreur de notre part, votre cotisation pour la période ${cotisation.periode}, ` +
          `d'un montant de ${formatEuros(Number(cotisation.montant), "fr")}, émise par ` +
          `${cotisation.tenant.raisonSociale}, était due le ` +
          `${formatDate(cotisation.dateEcheance!, "fr")} et reste impayée à ce jour.\n\n` +
          `Merci de bien vouloir procéder à son règlement dans les meilleurs délais. ` +
          `N'hésitez pas à nous contacter en cas de difficulté ou si ce message a croisé votre paiement.\n\n` +
          `Cordialement,\n${cotisation.tenant.raisonSociale}\n\n` +
          `Référence : ${lien}`
      );
      await prisma.cotisation.update({
        where: { id: cotisation.id },
        data: { dernierRappelEnvoyeAt: maintenant },
      });
      envoyees++;
    } catch (err) {
      console.error(`[relances-cotisations] Échec de l'envoi pour la cotisation ${cotisation.id}:`, err);
      ignorees++;
    }
  }

  return { examinees: candidates.length, envoyees, ignorees };
}
