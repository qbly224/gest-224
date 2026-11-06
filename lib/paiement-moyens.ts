export const MOYENS_PAIEMENT = ["virement", "especes", "cheque", "carte", "prelevement"] as const;
export type MoyenPaiement = (typeof MOYENS_PAIEMENT)[number];

export function estMoyenPaiementValide(value: string): value is MoyenPaiement {
  return (MOYENS_PAIEMENT as readonly string[]).includes(value);
}

export const LABELS_MOYEN_PAIEMENT: Record<MoyenPaiement, string> = {
  virement: "Virement bancaire",
  especes: "Espèces",
  cheque: "Chèque",
  carte: "Carte bancaire",
  prelevement: "Prélèvement SEPA",
};
