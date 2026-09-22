import "server-only";
import { prisma } from "@/lib/prisma";

export async function compterDocumentsMoisCourant(tenantId: string): Promise<number> {
  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);

  return prisma.document.count({
    where: { tenantId, createdAt: { gte: debutMois } },
  });
}

/** Nombre de documents créés par mois sur les `nbMois` derniers mois (pour les mini-graphiques du tableau de bord). */
export async function documentsParMoisRecents(tenantId: string, nbMois = 6): Promise<number[]> {
  const debut = new Date();
  debut.setDate(1);
  debut.setHours(0, 0, 0, 0);
  debut.setMonth(debut.getMonth() - (nbMois - 1));

  const documents = await prisma.document.findMany({
    where: { tenantId, createdAt: { gte: debut } },
    select: { createdAt: true },
  });

  const maintenant = new Date();
  const compteurs = new Array(nbMois).fill(0);
  for (const d of documents) {
    const moisEcart =
      (maintenant.getFullYear() - d.createdAt.getFullYear()) * 12 +
      (maintenant.getMonth() - d.createdAt.getMonth());
    const index = nbMois - 1 - moisEcart;
    if (index >= 0 && index < nbMois) compteurs[index]++;
  }
  return compteurs;
}

/** Nombre cumulé de clients créés, échantillonné en `nbPoints` points sur les `nbMois` derniers mois. */
export async function croissanceClientsRecente(
  tenantId: string,
  nbMois = 6
): Promise<number[]> {
  const debut = new Date();
  debut.setDate(1);
  debut.setHours(0, 0, 0, 0);
  debut.setMonth(debut.getMonth() - (nbMois - 1));

  const [avant, recents] = await Promise.all([
    prisma.client.count({ where: { tenantId, createdAt: { lt: debut } } }),
    prisma.client.findMany({
      where: { tenantId, createdAt: { gte: debut } },
      select: { createdAt: true },
    }),
  ]);

  const maintenant = new Date();
  const parMois = new Array(nbMois).fill(0);
  for (const c of recents) {
    const moisEcart =
      (maintenant.getFullYear() - c.createdAt.getFullYear()) * 12 +
      (maintenant.getMonth() - c.createdAt.getMonth());
    const index = nbMois - 1 - moisEcart;
    if (index >= 0 && index < nbMois) parMois[index]++;
  }

  const cumule: number[] = [];
  let total = avant;
  for (const n of parMois) {
    total += n;
    cumule.push(total);
  }
  return cumule;
}
