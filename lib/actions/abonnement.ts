"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { estPlanValide } from "@/lib/plans";

export async function changerPlan(formData: FormData): Promise<void> {
  const session = await requireSession();
  const plan = formData.get("plan");
  if (typeof plan !== "string" || !estPlanValide(plan)) return;

  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: { plan },
  });

  revalidatePath("/abonnement");
  revalidatePath("/tableau-de-bord");
}

export async function masquerOnboarding(): Promise<void> {
  const session = await requireSession();
  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: { onboardingMasque: true },
  });
  revalidatePath("/tableau-de-bord");
}
