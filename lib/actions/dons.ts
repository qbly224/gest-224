"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { donSchema } from "@/lib/validation/don";
import { paiementBloque, MESSAGE_PAIEMENT_BLOQUE } from "@/lib/paiement-guard";
import { withToast } from "@/lib/toast";
import { enregistrerAudit } from "@/lib/audit";
import { peutAcceder, MESSAGE_ACCES_REFUSE } from "@/lib/permissions";
import type { ActionState } from "@/lib/actions/types";

function parseDonForm(formData: FormData) {
  return donSchema.safeParse({
    type: formData.get("type"),
    donateur: formData.get("donateur"),
    montant: formData.get("montant"),
    date: formData.get("date"),
    notes: formData.get("notes") || undefined,
  });
}

export async function createDon(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  if (!peutAcceder(session.role, "dons")) {
    return { error: MESSAGE_ACCES_REFUSE };
  }
  const parsed = parseDonForm(formData);
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

  const don = await prisma.don.create({
    data: {
      tenantId: session.tenantId,
      type: data.type,
      donateur: data.donateur,
      montant: data.montant,
      date: new Date(data.date),
      notes: data.notes || null,
    },
  });
  await enregistrerAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: "don.cree",
    entite: "don",
    entiteId: don.id,
    details: { donateur: don.donateur, montant: data.montant, type: data.type },
  });

  revalidatePath("/dons");
  redirect(withToast("/dons", "Don enregistré."));
}

export async function updateDon(
  donId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  if (!peutAcceder(session.role, "dons")) {
    return { error: MESSAGE_ACCES_REFUSE };
  }
  const parsed = parseDonForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const existing = await prisma.don.findFirst({
    where: { id: donId, tenantId: session.tenantId },
  });
  if (!existing) {
    return { error: "Don introuvable." };
  }

  await prisma.don.update({
    where: { id: donId },
    data: {
      type: data.type,
      donateur: data.donateur,
      montant: data.montant,
      date: new Date(data.date),
      notes: data.notes || null,
    },
  });

  revalidatePath("/dons");
  revalidatePath(`/dons/${donId}`);
  return { success: true };
}

export async function supprimerDon(donId: string): Promise<void> {
  const session = await requireSession();
  if (!peutAcceder(session.role, "dons")) return;
  const existing = await prisma.don.findFirst({
    where: { id: donId, tenantId: session.tenantId },
  });
  if (!existing) return;

  await prisma.don.delete({ where: { id: donId } });
  await enregistrerAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: "don.supprime",
    entite: "don",
    entiteId: donId,
    details: { donateur: existing.donateur, montant: Number(existing.montant) },
  });

  revalidatePath("/dons");
  redirect(withToast("/dons", "Don supprimé."));
}
