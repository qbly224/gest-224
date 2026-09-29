"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { factureRecurrenteSchema } from "@/lib/validation/facture-recurrente";
import { withToast } from "@/lib/toast";
import type { ActionState } from "@/lib/actions/types";

function parseForm(formData: FormData) {
  return factureRecurrenteSchema.safeParse({
    clientId: formData.get("clientId"),
    designation: formData.get("designation"),
    description: formData.get("description") || undefined,
    quantite: formData.get("quantite"),
    prixUnitaireHt: formData.get("prixUnitaireHt"),
    tauxTva: formData.get("tauxTva") ? formData.get("tauxTva") : null,
    conditionsPaiement: formData.get("conditionsPaiement") || undefined,
    frequence: formData.get("frequence"),
    prochaineGenerationDate: formData.get("prochaineGenerationDate"),
  });
}

export async function createFactureRecurrente(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const [tenant, client] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId }, select: { regimeTva: true } }),
    prisma.client.findFirst({ where: { id: data.clientId, tenantId: session.tenantId } }),
  ]);
  if (!client) {
    return { fieldErrors: { clientId: ["Client introuvable."] } };
  }

  await prisma.factureRecurrente.create({
    data: {
      tenantId: session.tenantId,
      clientId: client.id,
      designation: data.designation,
      description: data.description || null,
      quantite: data.quantite,
      prixUnitaireHt: data.prixUnitaireHt,
      tauxTva: tenant.regimeTva === "franchise" ? null : data.tauxTva,
      conditionsPaiement: data.conditionsPaiement || null,
      frequence: data.frequence,
      prochaineGenerationDate: new Date(data.prochaineGenerationDate),
    },
  });

  revalidatePath("/factures-recurrentes");
  redirect(withToast("/factures-recurrentes", "Facture récurrente créée."));
}

export async function updateFactureRecurrente(
  modeleId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const [tenant, existing, client] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId }, select: { regimeTva: true } }),
    prisma.factureRecurrente.findFirst({ where: { id: modeleId, tenantId: session.tenantId } }),
    prisma.client.findFirst({ where: { id: data.clientId, tenantId: session.tenantId } }),
  ]);
  if (!existing) {
    return { error: "Facture récurrente introuvable." };
  }
  if (!client) {
    return { fieldErrors: { clientId: ["Client introuvable."] } };
  }

  await prisma.factureRecurrente.update({
    where: { id: modeleId },
    data: {
      clientId: client.id,
      designation: data.designation,
      description: data.description || null,
      quantite: data.quantite,
      prixUnitaireHt: data.prixUnitaireHt,
      tauxTva: tenant.regimeTva === "franchise" ? null : data.tauxTva,
      conditionsPaiement: data.conditionsPaiement || null,
      frequence: data.frequence,
      prochaineGenerationDate: new Date(data.prochaineGenerationDate),
    },
  });

  revalidatePath("/factures-recurrentes");
  redirect(withToast("/factures-recurrentes", "Facture récurrente modifiée."));
}

export async function toggleFactureRecurrenteActive(modeleId: string): Promise<void> {
  const session = await requireSession();
  const existing = await prisma.factureRecurrente.findFirst({
    where: { id: modeleId, tenantId: session.tenantId },
  });
  if (!existing) return;

  await prisma.factureRecurrente.update({
    where: { id: modeleId },
    data: { active: !existing.active },
  });

  revalidatePath("/factures-recurrentes");
  redirect(
    withToast("/factures-recurrentes", existing.active ? "Facture récurrente mise en pause." : "Facture récurrente réactivée.")
  );
}

export async function supprimerFactureRecurrente(modeleId: string): Promise<void> {
  const session = await requireSession();
  const existing = await prisma.factureRecurrente.findFirst({
    where: { id: modeleId, tenantId: session.tenantId },
  });
  if (!existing) return;

  await prisma.factureRecurrente.delete({ where: { id: modeleId } });

  revalidatePath("/factures-recurrentes");
  redirect(withToast("/factures-recurrentes", "Facture récurrente supprimée."));
}
