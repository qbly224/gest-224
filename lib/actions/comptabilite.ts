"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { depenseSchema } from "@/lib/validation/depense";
import type { ActionState } from "@/lib/actions/types";

function parseDepenseForm(formData: FormData) {
  return depenseSchema.safeParse({
    date: formData.get("date"),
    libelle: formData.get("libelle"),
    montant: formData.get("montant"),
    categorie: formData.get("categorie") || undefined,
  });
}

export async function createDepense(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const parsed = parseDepenseForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  await prisma.depense.create({
    data: {
      tenantId: session.tenantId,
      date: new Date(data.date),
      libelle: data.libelle,
      montant: data.montant,
      categorie: data.categorie || null,
    },
  });

  revalidatePath("/depenses");
  revalidatePath("/tableau-de-bord");
  redirect("/depenses");
}

export async function updateDepense(
  depenseId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const parsed = parseDepenseForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const existing = await prisma.depense.findFirst({
    where: { id: depenseId, tenantId: session.tenantId },
  });
  if (!existing) {
    return { error: "Dépense introuvable." };
  }

  await prisma.depense.update({
    where: { id: depenseId },
    data: {
      date: new Date(data.date),
      libelle: data.libelle,
      montant: data.montant,
      categorie: data.categorie || null,
    },
  });

  revalidatePath("/depenses");
  revalidatePath("/tableau-de-bord");
  redirect("/depenses");
}

export async function supprimerDepense(depenseId: string): Promise<void> {
  const session = await requireSession();
  const existing = await prisma.depense.findFirst({
    where: { id: depenseId, tenantId: session.tenantId },
  });
  if (!existing) return;

  await prisma.depense.delete({ where: { id: depenseId } });

  revalidatePath("/depenses");
  revalidatePath("/tableau-de-bord");
}

/**
 * Marque une facture ou une facture d'acompte comme payée et génère
 * automatiquement la ligne de recette correspondante, dans la même
 * transaction. Le montant enregistré est le montant TTC du document au
 * moment du paiement (immuable, comme le reste du document déjà émis).
 */
export async function marquerDocumentPaye(documentId: string): Promise<void> {
  const session = await requireSession();

  const document = await prisma.document.findFirst({
    where: { id: documentId, tenantId: session.tenantId },
  });
  if (!document) return;
  if (document.type !== "facture" && document.type !== "facture_acompte") return;
  if (document.statut !== "envoye") return;

  const basePath = document.type === "facture" ? "/factures" : "/factures-acompte";

  await prisma.$transaction(async (tx) => {
    await tx.document.update({
      where: { id: documentId },
      data: { statut: "payee", payeAt: new Date() },
    });
    await tx.recette.create({
      data: {
        tenantId: session.tenantId,
        documentId,
        montant: document.montantTtc,
        datePaiement: new Date(),
      },
    });
  });

  revalidatePath(basePath);
  revalidatePath(`${basePath}/${documentId}`);
  revalidatePath("/tableau-de-bord");
  revalidatePath("/recettes");
}
