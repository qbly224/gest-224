"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { depenseSchema } from "@/lib/validation/depense";
import { compterDepensesMoisCourant } from "@/lib/comptabilite/agregats";
import { PLANS } from "@/lib/plans";
import { paiementBloque, MESSAGE_PAIEMENT_BLOQUE } from "@/lib/paiement-guard";
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

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: session.tenantId },
    select: { plan: true, paiementValide: true },
  });
  if (paiementBloque(tenant)) {
    return { error: MESSAGE_PAIEMENT_BLOQUE };
  }
  const limiteDepenses = PLANS[tenant.plan].limiteDepensesParMois;
  if (limiteDepenses !== null) {
    const nbCeMois = await compterDepensesMoisCourant(session.tenantId);
    if (nbCeMois >= limiteDepenses) {
      return {
        error: `Limite de ${limiteDepenses} dépenses par mois atteinte pour le plan ${PLANS[tenant.plan].label}. Passez à un plan supérieur depuis la page Abonnement pour continuer.`,
      };
    }
  }

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
    // updateMany conditionné sur le statut, plutôt qu'un update par id suivi
    // d'une vérification séparée : sans ça, deux clics concurrents peuvent
    // tous deux passer le contrôle de statut ci-dessus avant que l'un des
    // deux n'écrive, et le second créerait une seconde recette pour la même
    // facture (ou plantait sur la contrainte unique documentId).
    const { count } = await tx.document.updateMany({
      where: { id: documentId, statut: "envoye" },
      data: { statut: "payee", payeAt: new Date() },
    });
    if (count === 0) return;

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
