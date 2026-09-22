import "server-only";
import { prisma } from "@/lib/prisma";

export type RapportComplet = {
  soldeEtVueMensuelle: SoldeEtVueMensuelle;
  depensesParCategorie: { categorie: string; montant: number }[];
  documentsParType: { type: string; nombre: number }[];
  topClients: { nom: string; montant: number }[];
};

/** Rapport agrégé complet, réservé aux plans avec `rapportComplet` (cf. lib/plans.ts). */
export async function calculerRapportComplet(tenantId: string): Promise<RapportComplet> {
  const [soldeEtVueMensuelle, depenses, documents, recettesAvecClient] = await Promise.all([
    calculerSoldeEtVueMensuelle(tenantId, 12),
    prisma.depense.findMany({ where: { tenantId }, select: { montant: true, categorie: true } }),
    prisma.document.groupBy({
      by: ["type"],
      where: { tenantId },
      _count: { _all: true },
    }),
    prisma.recette.findMany({
      where: { tenantId },
      select: {
        montant: true,
        document: { select: { client: { select: { raisonSociale: true, nom: true, prenom: true } } } },
      },
    }),
  ]);

  const depensesParCategorieMap = new Map<string, number>();
  for (const d of depenses) {
    const cle = d.categorie || "Non catégorisé";
    depensesParCategorieMap.set(cle, (depensesParCategorieMap.get(cle) ?? 0) + Number(d.montant));
  }

  const clientsMap = new Map<string, number>();
  for (const r of recettesAvecClient) {
    const c = r.document.client;
    const nom = c.raisonSociale || [c.prenom, c.nom].filter(Boolean).join(" ") || "Client inconnu";
    clientsMap.set(nom, (clientsMap.get(nom) ?? 0) + Number(r.montant));
  }

  return {
    soldeEtVueMensuelle,
    depensesParCategorie: [...depensesParCategorieMap.entries()]
      .map(([categorie, montant]) => ({ categorie, montant }))
      .sort((a, b) => b.montant - a.montant),
    documentsParType: documents.map((d) => ({ type: d.type, nombre: d._count._all })),
    topClients: [...clientsMap.entries()]
      .map(([nom, montant]) => ({ nom, montant }))
      .sort((a, b) => b.montant - a.montant)
      .slice(0, 10),
  };
}

export async function compterDepensesMoisCourant(tenantId: string): Promise<number> {
  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);

  return prisma.depense.count({
    where: { tenantId, createdAt: { gte: debutMois } },
  });
}

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
