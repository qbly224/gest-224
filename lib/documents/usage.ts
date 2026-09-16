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
