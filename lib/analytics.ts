import "server-only";
import { prisma } from "@/lib/prisma";

export type StatistiquesAudience = {
  vues7Jours: number;
  vues30Jours: number;
  pagesPopulaires: { path: string; vues: number }[];
};

export async function calculerStatistiquesAudience(): Promise<StatistiquesAudience> {
  const maintenant = new Date();
  const il7Jours = new Date(maintenant.getTime() - 7 * 24 * 60 * 60 * 1000);
  const il30Jours = new Date(maintenant.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [vues7Jours, vues30Jours, groupes] = await Promise.all([
    prisma.pageView.count({ where: { createdAt: { gte: il7Jours } } }),
    prisma.pageView.count({ where: { createdAt: { gte: il30Jours } } }),
    prisma.pageView.groupBy({
      by: ["path"],
      where: { createdAt: { gte: il30Jours } },
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 8,
    }),
  ]);

  return {
    vues7Jours,
    vues30Jours,
    pagesPopulaires: groupes.map((g) => ({ path: g.path, vues: g._count.path })),
  };
}
