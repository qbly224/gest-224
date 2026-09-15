// Calculs HT/TVA/TTC — importé aussi bien côté serveur (actions) que côté
// client (aperçu en temps réel dans le formulaire), d'où l'absence de toute
// dépendance serveur ici.

export type LigneCalculable = {
  quantite: number;
  prixUnitaireHt: number;
  tauxTva: number | null;
  remisePourcentage: number;
};

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function calculerMontantLigneHt(ligne: LigneCalculable): number {
  const brut = ligne.quantite * ligne.prixUnitaireHt;
  const remise = brut * (ligne.remisePourcentage / 100);
  return round2(brut - remise);
}

export type TotauxDocument = {
  montantHt: number;
  montantTva: number;
  montantTtc: number;
  // Détail de la TVA par taux, pour l'affichage réglementaire groupé.
  tvaParTaux: { taux: number; baseHt: number; montantTva: number }[];
};

export function calculerTotaux(lignes: LigneCalculable[]): TotauxDocument {
  let montantHt = 0;
  const baseParTaux = new Map<number, number>();

  for (const ligne of lignes) {
    const ht = calculerMontantLigneHt(ligne);
    montantHt = round2(montantHt + ht);
    if (ligne.tauxTva !== null) {
      baseParTaux.set(ligne.tauxTva, round2((baseParTaux.get(ligne.tauxTva) ?? 0) + ht));
    }
  }

  const tvaParTaux = [...baseParTaux.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([taux, baseHt]) => ({
      taux,
      baseHt,
      montantTva: round2(baseHt * (taux / 100)),
    }));

  const montantTva = round2(tvaParTaux.reduce((sum, t) => sum + t.montantTva, 0));
  const montantTtc = round2(montantHt + montantTva);

  return { montantHt, montantTva, montantTtc, tvaParTaux };
}
