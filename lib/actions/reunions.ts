"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { reunionSchema } from "@/lib/validation/reunion";
import { paiementBloque, MESSAGE_PAIEMENT_BLOQUE } from "@/lib/paiement-guard";
import { withToast } from "@/lib/toast";
import type { ActionState } from "@/lib/actions/types";

function parseReunionForm(formData: FormData) {
  return reunionSchema.safeParse({
    titre: formData.get("titre"),
    date: formData.get("date"),
    lieu: formData.get("lieu") || undefined,
    description: formData.get("description") || undefined,
    compteRendu: formData.get("compteRendu") || undefined,
  });
}

export async function createReunion(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const parsed = parseReunionForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: session.tenantId },
    select: { plan: true, paiementValide: true },
  });
  if (paiementBloque(tenant)) {
    return { error: MESSAGE_PAIEMENT_BLOQUE };
  }

  const reunion = await prisma.reunion.create({
    data: {
      tenantId: session.tenantId,
      titre: data.titre,
      date: new Date(data.date),
      lieu: data.lieu || null,
      description: data.description || null,
      compteRendu: data.compteRendu || null,
    },
  });

  revalidatePath("/reunions");
  redirect(withToast(`/reunions/${reunion.id}`, "Réunion enregistrée."));
}

export async function updateReunion(
  reunionId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const parsed = parseReunionForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const existing = await prisma.reunion.findFirst({
    where: { id: reunionId, tenantId: session.tenantId },
  });
  if (!existing) {
    return { error: "Réunion introuvable." };
  }

  await prisma.reunion.update({
    where: { id: reunionId },
    data: {
      titre: data.titre,
      date: new Date(data.date),
      lieu: data.lieu || null,
      description: data.description || null,
      compteRendu: data.compteRendu || null,
    },
  });

  revalidatePath("/reunions");
  revalidatePath(`/reunions/${reunionId}`);
  return { success: true };
}

export async function supprimerReunion(reunionId: string): Promise<void> {
  const session = await requireSession();
  const existing = await prisma.reunion.findFirst({
    where: { id: reunionId, tenantId: session.tenantId },
  });
  if (!existing) return;

  await prisma.reunion.delete({ where: { id: reunionId } });

  revalidatePath("/reunions");
  redirect(withToast("/reunions", "Réunion supprimée."));
}
