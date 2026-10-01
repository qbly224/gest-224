"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/auth-admin";
import { estPlanValide } from "@/lib/plans";
import { enregistrerAudit } from "@/lib/audit";

export async function basculerActifTenant(tenantId: string): Promise<void> {
  const admin = await requirePlatformAdmin();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { actif: true },
  });
  if (!tenant) return;

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { actif: !tenant.actif },
  });
  await enregistrerAudit({
    tenantId,
    userId: admin.userId,
    action: "admin.tenant.actif_bascule",
    entite: "tenant",
    entiteId: tenantId,
    details: { nouvelEtat: !tenant.actif },
  });

  revalidatePath("/admin");
}

export async function changerPlanTenant(tenantId: string, formData: FormData): Promise<void> {
  const admin = await requirePlatformAdmin();

  const plan = formData.get("plan");
  if (typeof plan !== "string" || !estPlanValide(plan)) return;

  await prisma.tenant.update({
    // Un changement de plan décidé par un admin vaut validation : il n'y a
    // pas de sens à laisser le tenant bloqué en écriture juste après que
    // l'admin lui-même vient de lui attribuer ce plan.
    where: { id: tenantId },
    data: { plan, paiementValide: true },
  });
  await enregistrerAudit({
    tenantId,
    userId: admin.userId,
    action: "admin.tenant.plan_change",
    entite: "tenant",
    entiteId: tenantId,
    details: { nouveauPlan: plan },
  });

  revalidatePath("/admin");
}

/** Valide ou suspend le paiement d'un tenant sur un plan payant, sans en changer le plan. */
export async function basculerPaiementValideTenant(tenantId: string): Promise<void> {
  const admin = await requirePlatformAdmin();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { paiementValide: true },
  });
  if (!tenant) return;

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { paiementValide: !tenant.paiementValide },
  });
  await enregistrerAudit({
    tenantId,
    userId: admin.userId,
    action: "admin.tenant.paiement_valide_bascule",
    entite: "tenant",
    entiteId: tenantId,
    details: { nouvelEtat: !tenant.paiementValide },
  });

  revalidatePath("/admin");
}
