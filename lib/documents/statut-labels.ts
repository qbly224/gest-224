import type { StatutDocument } from "@prisma/client";

export const STATUT_LABELS: Record<StatutDocument, string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  accepte: "Accepté",
  refuse: "Refusé",
  converti: "Converti en facture",
  livre: "Livré",
  payee_partiellement: "Payée partiellement",
  payee: "Payée",
  en_retard: "En retard",
  annule: "Annulé",
};
