import "server-only";
import { prisma } from "@/lib/prisma";

export type MoisAgregat = {
  mois: string; // "2026-01"
  label: string; // "janvier 2026"
  recettes: number;
  depenses: number;
  solde: number;
};

export type SoldeEtVueMensuelle = {
  totalRecettes: number;
  totalDepenses: number;
  solde: number;
  mois: MoisAgregat[];
};

/** Solde global (toutes dates) + agrégation par mois sur les `nbMois` derniers mois. */
export async function calculerSoldeEtVueMensuelle(
  tenantId: string,
  nbMois = 6
): Promise<SoldeEtVueMensuelle> {
  const [recettes, depenses] = await Promise.all([
    prisma.recette.findMany({
      where: { tenantId },
      select: { montant: true, datePaiement: true },
    }),
    prisma.depense.findMany({
      where: { tenantId },
      select: { montant: true, date: true },
    }),
  ]);

  const totalRecettes = recettes.reduce((sum, r) => sum + Number(r.montant), 0);
  const totalDepenses = depenses.reduce((sum, d) => sum + Number(d.montant), 0);

  const maintenant = new Date();
  const mois: MoisAgregat[] = [];
  for (let i = nbMois - 1; i >= 0; i--) {
    const d = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
    const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    mois.push({
      mois: cle,
      label: new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(d),
      recettes: 0,
      depenses: 0,
      solde: 0,
    });
  }
  const index = new Map(mois.map((m) => [m.mois, m]));

  const cleMois = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  for (const r of recettes) {
    const m = index.get(cleMois(r.datePaiement));
    if (m) m.recettes += Number(r.montant);
  }
  for (const d of depenses) {
    const m = index.get(cleMois(d.date));
    if (m) m.depenses += Number(d.montant);
  }
  for (const m of mois) {
    m.solde = m.recettes - m.depenses;
  }

  return { totalRecettes, totalDepenses, solde: totalRecettes - totalDepenses, mois };
}
