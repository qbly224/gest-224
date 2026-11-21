"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { cotisationSchema } from "@/lib/validation/cotisation";
import { paiementBloque, MESSAGE_PAIEMENT_BLOQUE } from "@/lib/paiement-guard";
import { withToast } from "@/lib/toast";
import { enregistrerAudit } from "@/lib/audit";
import { peutAcceder, MESSAGE_ACCES_REFUSE } from "@/lib/permissions";
import type { ActionState } from "@/lib/actions/types";

function parseCotisationForm(formData: FormData) {
  return cotisationSchema.safeParse({
    membreId: formData.get("membreId"),
    periode: formData.get("periode"),
    montant: formData.get("montant"),
    datePaiement: formData.get("datePaiement") || undefined,
    moyenPaiement: formData.get("moyenPaiement") || undefined,
  });
}

export async function createCotisation(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  if (!peutAcceder(session.role, "cotisations")) {
    return { error: MESSAGE_ACCES_REFUSE };
  }
  const parsed = parseCotisationForm(formData);
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

  const membre = await prisma.membre.findFirst({
    where: { id: data.membreId, tenantId: session.tenantId },
  });
  if (!membre) {
    return { fieldErrors: { membreId: ["Membre introuvable."] } };
  }

  const cotisation = await prisma.cotisation.create({
    data: {
      tenantId: session.tenantId,
      membreId: data.membreId,
      periode: data.periode,
      montant: data.montant,
      datePaiement: data.datePaiement ? new Date(data.datePaiement) : null,
      moyenPaiement: data.moyenPaiement || null,
    },
  });
  await enregistrerAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: "cotisation.creee",
    entite: "cotisation",
    entiteId: cotisation.id,
    details: { membre: `${membre.prenom} ${membre.nom}`, periode: data.periode, montant: data.montant },
  });

  revalidatePath("/cotisations");
  revalidatePath(`/membres/${data.membreId}`);
  redirect(withToast("/cotisations", "Cotisation enregistrée."));
}

export async function updateCotisation(
  cotisationId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  if (!peutAcceder(session.role, "cotisations")) {
    return { error: MESSAGE_ACCES_REFUSE };
  }
  const parsed = parseCotisationForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const existing = await prisma.cotisation.findFirst({
    where: { id: cotisationId, tenantId: session.tenantId },
  });
  if (!existing) {
    return { error: "Cotisation introuvable." };
  }

  const etaitPayee = existing.datePaiement !== null;
  const estPayee = Boolean(data.datePaiement);

  await prisma.cotisation.update({
    where: { id: cotisationId },
    data: {
      membreId: data.membreId,
      periode: data.periode,
      montant: data.montant,
      datePaiement: data.datePaiement ? new Date(data.datePaiement) : null,
      moyenPaiement: data.moyenPaiement || null,
    },
  });

  if (!etaitPayee && estPayee) {
    await enregistrerAudit({
      tenantId: session.tenantId,
      userId: session.userId,
      action: "cotisation.marquee_payee",
      entite: "cotisation",
      entiteId: cotisationId,
      details: { periode: data.periode, montant: data.montant },
    });
  }

  revalidatePath("/cotisations");
  revalidatePath(`/membres/${data.membreId}`);
  return { success: true };
}

export async function marquerCotisationPayee(cotisationId: string): Promise<void> {
  const session = await requireSession();
  if (!peutAcceder(session.role, "cotisations")) return;
  const existing = await prisma.cotisation.findFirst({
    where: { id: cotisationId, tenantId: session.tenantId },
  });
  if (!existing || existing.datePaiement) return;

  await prisma.cotisation.update({
    where: { id: cotisationId },
    data: { datePaiement: new Date() },
  });
  await enregistrerAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: "cotisation.marquee_payee",
    entite: "cotisation",
    entiteId: cotisationId,
    details: { periode: existing.periode, montant: Number(existing.montant) },
  });

  revalidatePath("/cotisations");
  revalidatePath(`/membres/${existing.membreId}`);
}

export async function supprimerCotisation(cotisationId: string): Promise<void> {
  const session = await requireSession();
  if (!peutAcceder(session.role, "cotisations")) return;
  const existing = await prisma.cotisation.findFirst({
    where: { id: cotisationId, tenantId: session.tenantId },
  });
  if (!existing) return;

  await prisma.cotisation.delete({ where: { id: cotisationId } });
  await enregistrerAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: "cotisation.supprimee",
    entite: "cotisation",
    entiteId: cotisationId,
    details: { periode: existing.periode, montant: Number(existing.montant) },
  });

  revalidatePath("/cotisations");
  revalidatePath(`/membres/${existing.membreId}`);
  redirect(withToast("/cotisations", "Cotisation supprimée."));
}
