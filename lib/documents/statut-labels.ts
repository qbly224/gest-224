import type { StatutDocument, TypeDocument } from "@prisma/client";

export const STATUT_LABELS: Record<StatutDocument, string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  accepte: "Accepté",
  refuse: "Refusé",
  converti: "Converti",
  livre: "Livré",
  payee_partiellement: "Payée partiellement",
  payee: "Payée",
  en_retard: "En retard",
  annule: "Annulé",
};

export const TITRES_DOCUMENT: Record<TypeDocument, string> = {
  devis: "Devis",
  bon_commande: "Bon de commande",
  bon_livraison: "Bon de livraison",
  facture: "Facture",
  facture_acompte: "Facture d'acompte",
  facture_avoir: "Avoir",
};
