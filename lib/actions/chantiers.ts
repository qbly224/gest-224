"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { chantierSchema } from "@/lib/validation/chantier";
import { withToast } from "@/lib/toast";
import type { ActionState } from "@/lib/actions/types";
import type { StatutChantier } from "@prisma/client";

function parseForm(formData: FormData) {
  return chantierSchema.safeParse({
    titre: formData.get("titre"),
    clientId: formData.get("clientId") || undefined,
    description: formData.get("description") || undefined,
    adresse: formData.get("adresse") || undefined,
    montant: formData.get("montant") || undefined,
    statut: formData.get("statut"),
    dateDebut: formData.get("dateDebut") || undefined,
    dateEcheance: formData.get("dateEcheance") || undefined,
  });
}

export async function createChantier(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  if (data.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: data.clientId, tenantId: session.tenantId },
    });
    if (!client) {
      return { fieldErrors: { clientId: ["Client introuvable."] } };
    }
  }

  await prisma.chantier.create({
    data: {
      tenantId: session.tenantId,
      clientId: data.clientId || null,
      titre: data.titre,
      description: data.description || null,
      adresse: data.adresse || null,
      montant: data.montant === "" || data.montant === undefined ? null : data.montant,
      statut: data.statut,
      dateDebut: data.dateDebut ? new Date(data.dateDebut) : null,
      dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
      dateRealisation: data.statut === "fait" ? new Date() : null,
    },
  });

  revalidatePath("/chantiers");
  redirect(withToast("/chantiers", "Chantier créé."));
}

export async function updateChantier(
  chantierId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const existing = await prisma.chantier.findFirst({
    where: { id: chantierId, tenantId: session.tenantId },
  });
  if (!existing) {
    return { error: "Chantier introuvable." };
  }

  if (data.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: data.clientId, tenantId: session.tenantId },
    });
    if (!client) {
      return { fieldErrors: { clientId: ["Client introuvable."] } };
    }
  }

  await prisma.chantier.update({
    where: { id: chantierId },
    data: {
      clientId: data.clientId || null,
      titre: data.titre,
      description: data.description || null,
      adresse: data.adresse || null,
      montant: data.montant === "" || data.montant === undefined ? null : data.montant,
      statut: data.statut,
      dateDebut: data.dateDebut ? new Date(data.dateDebut) : null,
      dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
      dateRealisation:
        data.statut === "fait" ? existing.dateRealisation ?? new Date() : null,
    },
  });

  revalidatePath("/chantiers");
  redirect(withToast("/chantiers", "Chantier modifié."));
}

export async function changerStatutChantier(
  chantierId: string,
  formData: FormData
): Promise<void> {
  const session = await requireSession();
  const statut = formData.get("statut") as StatutChantier | null;
  if (!statut) return;

  const existing = await prisma.chantier.findFirst({
    where: { id: chantierId, tenantId: session.tenantId },
  });
  if (!existing) return;

  await prisma.chantier.update({
    where: { id: chantierId },
    data: {
      statut,
      dateRealisation: statut === "fait" ? existing.dateRealisation ?? new Date() : null,
    },
  });

  revalidatePath("/chantiers");
  redirect(withToast("/chantiers", "Statut mis à jour."));
}

export async function supprimerChantier(chantierId: string): Promise<void> {
  const session = await requireSession();
  const existing = await prisma.chantier.findFirst({
    where: { id: chantierId, tenantId: session.tenantId },
  });
  if (!existing) return;

  await prisma.chantier.delete({ where: { id: chantierId } });

  revalidatePath("/chantiers");
  redirect(withToast("/chantiers", "Chantier supprimé."));
}
