import "server-only";
import { prisma } from "@/lib/prisma";
import { limitesEffectives } from "@/lib/plans";
import type { PlanAbonnement, TypeCompte } from "@prisma/client";

export const MESSAGE_LIMITE_PDF =
  "Limite de génération de PDF atteinte pour le plan gratuit ce mois-ci. Passez à un plan supérieur depuis la page Abonnement pour continuer.";

async function compterGenerationsPdfMoisCourant(tenantId: string): Promise<number> {
  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);

  return prisma.generationPdf.count({
    where: { tenantId, createdAt: { gte: debutMois } },
  });
}

/**
 * Vérifie la limite mensuelle de génération de PDF du plan puis, si elle
 * est respectée, enregistre cette génération. Renvoie false sans rien
 * enregistrer si la limite est déjà atteinte - à appeler avant
 * genererPdf() (cf. lib/pdf/generate.ts), jamais après : pas la peine de
 * payer le rendu Chromium pour une génération qu'on va refuser.
 */
export async function autoriserGenerationPdf(tenant: {
  id: string;
  plan: PlanAbonnement;
  typeCompte: TypeCompte;
}): Promise<boolean> {
  const limite = limitesEffectives(tenant).limitePdfParMois;
  if (limite !== null) {
    const nb = await compterGenerationsPdfMoisCourant(tenant.id);
    if (nb >= limite) return false;
  }

  await prisma.generationPdf.create({ data: { tenantId: tenant.id } });
  return true;
}
