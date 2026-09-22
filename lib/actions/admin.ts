"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/auth-admin";
import { estPlanValide } from "@/lib/plans";

export async function basculerActifTenant(tenantId: string): Promise<void> {
  await requirePlatformAdmin();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { actif: true },
  });
  if (!tenant) return;

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { actif: !tenant.actif },
  });

  revalidatePath("/admin");
}

export async function changerPlanTenant(tenantId: string, formData: FormData): Promise<void> {
  await requirePlatformAdmin();

  const plan = formData.get("plan");
  if (typeof plan !== "string" || !estPlanValide(plan)) return;

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { plan },
  });

  revalidatePath("/admin");
}
