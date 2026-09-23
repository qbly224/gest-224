"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { articleSchema } from "@/lib/validation/article";
import { paiementBloque, MESSAGE_PAIEMENT_BLOQUE } from "@/lib/paiement-guard";
import type { ActionState } from "@/lib/actions/types";

function parseArticleForm(formData: FormData, regimeTva: "normal" | "franchise") {
  const rawTauxTva = formData.get("tauxTva");
  return articleSchema.safeParse({
    type: formData.get("type"),
    reference: formData.get("reference") || undefined,
    designation: formData.get("designation"),
    description: formData.get("description") || undefined,
    uniteMesure: formData.get("uniteMesure") || undefined,
    prixUnitaireHt: formData.get("prixUnitaireHt"),
    // En franchise, aucune TVA n'est jamais appliquée : on ignore la valeur
    // envoyée par le formulaire (champ normalement masqué côté UI).
    tauxTva: regimeTva === "franchise" ? null : rawTauxTva,
  });
}

export async function createArticle(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: session.tenantId },
    select: { regimeTva: true, plan: true, paiementValide: true },
  });
  if (paiementBloque(tenant)) {
    return { error: MESSAGE_PAIEMENT_BLOQUE };
  }

  const parsed = parseArticleForm(formData, tenant.regimeTva);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const article = await prisma.article.create({
    data: {
      tenantId: session.tenantId,
      type: data.type,
      reference: data.reference || null,
      designation: data.designation,
      description: data.description || null,
      uniteMesure: data.uniteMesure || "unité",
      prixUnitaireHt: data.prixUnitaireHt,
      tauxTva: data.tauxTva,
    },
  });

  revalidatePath("/catalogue");
  redirect(`/catalogue/${article.id}`);
}

export async function updateArticle(
  articleId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: session.tenantId },
    select: { regimeTva: true },
  });

  const parsed = parseArticleForm(formData, tenant.regimeTva);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const existing = await prisma.article.findFirst({
    where: { id: articleId, tenantId: session.tenantId },
  });
  if (!existing) {
    return { error: "Article introuvable." };
  }

  await prisma.article.update({
    where: { id: articleId },
    data: {
      type: data.type,
      reference: data.reference || null,
      designation: data.designation,
      description: data.description || null,
      uniteMesure: data.uniteMesure || "unité",
      prixUnitaireHt: data.prixUnitaireHt,
      tauxTva: data.tauxTva,
    },
  });

  revalidatePath("/catalogue");
  revalidatePath(`/catalogue/${articleId}`);
  return { success: true };
}

export async function toggleArticleActif(articleId: string): Promise<void> {
  const session = await requireSession();

  const existing = await prisma.article.findFirst({
    where: { id: articleId, tenantId: session.tenantId },
  });
  if (!existing) return;

  await prisma.article.update({
    where: { id: articleId },
    data: { actif: !existing.actif },
  });

  revalidatePath("/catalogue");
  revalidatePath(`/catalogue/${articleId}`);
}
