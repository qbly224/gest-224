"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function masquerOnboarding(): Promise<void> {
  const session = await requireSession();
  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: { onboardingMasque: true },
  });
  revalidatePath("/tableau-de-bord");
}
