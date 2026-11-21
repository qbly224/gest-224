"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { ligneBudgetSchema } from "@/lib/validation/budget";
import { paiementBloque, MESSAGE_PAIEMENT_BLOQUE } from "@/lib/paiement-guard";
import { withToast } from "@/lib/toast";
import type { ActionState } from "@/lib/actions/types";

function parseLigneBudgetForm(formData: FormData) {
  return ligneBudgetSchema.safeParse({
    annee: formData.get("annee"),
    categorie: formData.get("categorie"),
    type: formData.get("type"),
    montantPrevu: formData.get("montantPrevu"),
    notes: formData.get("notes") || undefined,
  });
}

export async function createLigneBudget(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const parsed = parseLigneBudgetForm(formData);
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

  await prisma.ligneBudget.create({
    data: {
      tenantId: session.tenantId,
      annee: data.annee,
      categorie: data.categorie,
      type: data.type,
      montantPrevu: data.montantPrevu,
      notes: data.notes || null,
    },
  });

  revalidatePath("/budget");
  redirect(withToast(`/budget?annee=${data.annee}`, "Ligne de budget enregistrée."));
}

export async function updateLigneBudget(
  ligneId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const parsed = parseLigneBudgetForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const existing = await prisma.ligneBudget.findFirst({
    where: { id: ligneId, tenantId: session.tenantId },
  });
  if (!existing) {
    return { error: "Ligne de budget introuvable." };
  }

  await prisma.ligneBudget.update({
    where: { id: ligneId },
    data: {
      annee: data.annee,
      categorie: data.categorie,
      type: data.type,
      montantPrevu: data.montantPrevu,
      notes: data.notes || null,
    },
  });

  revalidatePath("/budget");
  return { success: true };
}

export async function supprimerLigneBudget(ligneId: string): Promise<void> {
  const session = await requireSession();
  const existing = await prisma.ligneBudget.findFirst({
    where: { id: ligneId, tenantId: session.tenantId },
  });
  if (!existing) return;

  await prisma.ligneBudget.delete({ where: { id: ligneId } });

  revalidatePath("/budget");
  redirect(withToast(`/budget?annee=${existing.annee}`, "Ligne de budget supprimée."));
}
