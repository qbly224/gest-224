import type { FrequenceRecurrence } from "@prisma/client";

const MOIS_PAR_FREQUENCE: Record<FrequenceRecurrence, number> = {
  mensuelle: 1,
  trimestrielle: 3,
  annuelle: 12,
};

/**
 * Date de génération suivante pour une fréquence donnée. Si l'ajout de
 * mois fait déborder le jour (ex. 31 janvier + 1 mois), on revient au
 * dernier jour du mois cible plutôt que de sauter au mois suivant (ce que
 * ferait Date.setMonth par défaut).
 */
export function prochaineDateGeneration(date: Date, frequence: FrequenceRecurrence): Date {
  const jourOriginal = date.getDate();
  const suivante = new Date(date);
  suivante.setMonth(suivante.getMonth() + MOIS_PAR_FREQUENCE[frequence]);
  if (suivante.getDate() !== jourOriginal) {
    suivante.setDate(0);
  }
  return suivante;
}
