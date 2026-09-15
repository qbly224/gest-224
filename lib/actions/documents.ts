"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { TypeDocument } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { documentBaseSchema } from "@/lib/validation/document";
import { calculerMontantLigneHt, calculerTotaux } from "@/lib/documents/calc";
import { getNextNumero } from "@/lib/documents/numbering";
import { buildEmetteurSnapshot, buildClientSnapshot } from "@/lib/documents/snapshot";
import type { ActionState } from "@/lib/actions/types";

const BASE_PATH: Record<"devis" | "facture", string> = {
  devis: "/devis",
  facture: "/factures",
};

function parseDocumentForm(formData: FormData) {
  let lignesParsed: unknown = [];
  try {
    lignesParsed = JSON.parse(String(formData.get("lignesJson") ?? "[]"));
  } catch {
    lignesParsed = [];
  }

  return documentBaseSchema.safeParse({
    clientId: formData.get("clientId"),
    dateEmission: formData.get("dateEmission"),
    dateEcheance: formData.get("dateEcheance") || undefined,
    conditionsPaiement: formData.get("conditionsPaiement") || undefined,
    tauxPenaliteRetard: formData.get("tauxPenaliteRetard") || undefined,
    notes: formData.get("notes") || undefined,
    lignes: lignesParsed,
  });
}

async function createDocument(
  type: "devis" | "facture",
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const parsed = parseDocumentForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const [tenant, client] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId } }),
    prisma.client.findFirst({ where: { id: data.clientId, tenantId: session.tenantId } }),
  ]);
  if (!client) {
    return { fieldErrors: { clientId: ["Client introuvable."] } };
  }

  // En franchise en base, aucune TVA n'est jamais appliquée, quelle que
  // soit la valeur envoyée par le formulaire (défense en profondeur : le
  // formulaire masque déjà le champ côté UI).
  const lignes = data.lignes.map((l) => ({
    ...l,
    tauxTva: tenant.regimeTva === "franchise" ? null : l.tauxTva,
  }));

  const totaux = calculerTotaux(lignes);

  const document = await prisma.$transaction(async (tx) => {
    const numero = await getNextNumero(tx, session.tenantId, type);
    return tx.document.create({
      data: {
        tenantId: session.tenantId,
        type,
        numero,
        statut: "brouillon",
        clientId: client.id,
        dateEmission: new Date(data.dateEmission),
        dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
        conditionsPaiement: data.conditionsPaiement || null,
        tauxPenaliteRetard:
          type === "facture" ? data.tauxPenaliteRetard ?? 10 : null,
        notes: data.notes || null,
        montantHt: totaux.montantHt,
        montantTva: totaux.montantTva,
        montantTtc: totaux.montantTtc,
        emetteurSnapshot: buildEmetteurSnapshot(tenant),
        clientSnapshot: buildClientSnapshot(client),
        createdById: session.userId,
        lignes: {
          create: lignes.map((l, index) => ({
            ordre: index,
            articleId: l.articleId || null,
            designation: l.designation,
            description: l.description || null,
            uniteMesure: l.uniteMesure || null,
            quantite: l.quantite,
            prixUnitaireHt: l.prixUnitaireHt,
            tauxTva: l.tauxTva,
            remisePourcentage: l.remisePourcentage,
            montantHt: calculerMontantLigneHt(l),
          })),
        },
      },
    });
  });

  revalidatePath(BASE_PATH[type]);
  redirect(`${BASE_PATH[type]}/${document.id}`);
}

export async function createDevis(prevState: ActionState, formData: FormData) {
  return createDocument("devis", prevState, formData);
}

export async function createFacture(prevState: ActionState, formData: FormData) {
  return createDocument("facture", prevState, formData);
}

async function updateDocument(
  type: "devis" | "facture",
  documentId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const parsed = parseDocumentForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const existing = await prisma.document.findFirst({
    where: { id: documentId, tenantId: session.tenantId, type },
  });
  if (!existing) {
    return { error: "Document introuvable." };
  }
  if (existing.statut !== "brouillon") {
    return {
      error:
        "Ce document a déjà été validé : ses mentions légales et sa numérotation ne peuvent plus être modifiées.",
    };
  }

  const [tenant, client] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId } }),
    prisma.client.findFirst({ where: { id: data.clientId, tenantId: session.tenantId } }),
  ]);
  if (!client) {
    return { fieldErrors: { clientId: ["Client introuvable."] } };
  }

  const lignes = data.lignes.map((l) => ({
    ...l,
    tauxTva: tenant.regimeTva === "franchise" ? null : l.tauxTva,
  }));
  const totaux = calculerTotaux(lignes);

  await prisma.$transaction(async (tx) => {
    await tx.documentLigne.deleteMany({ where: { documentId } });
    await tx.document.update({
      where: { id: documentId },
      data: {
        clientId: client.id,
        dateEmission: new Date(data.dateEmission),
        dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
        conditionsPaiement: data.conditionsPaiement || null,
        tauxPenaliteRetard:
          type === "facture" ? data.tauxPenaliteRetard ?? 10 : null,
        notes: data.notes || null,
        montantHt: totaux.montantHt,
        montantTva: totaux.montantTva,
        montantTtc: totaux.montantTtc,
        // Le document n'est pas encore émis : on peut réactualiser les
        // copies figées vendeur/acheteur sur les données courantes.
        emetteurSnapshot: buildEmetteurSnapshot(tenant),
        clientSnapshot: buildClientSnapshot(client),
        lignes: {
          create: lignes.map((l, index) => ({
            ordre: index,
            articleId: l.articleId || null,
            designation: l.designation,
            description: l.description || null,
            uniteMesure: l.uniteMesure || null,
            quantite: l.quantite,
            prixUnitaireHt: l.prixUnitaireHt,
            tauxTva: l.tauxTva,
            remisePourcentage: l.remisePourcentage,
            montantHt: calculerMontantLigneHt(l),
          })),
        },
      },
    });
  });

  revalidatePath(BASE_PATH[type]);
  revalidatePath(`${BASE_PATH[type]}/${documentId}`);
  return { success: true };
}

export async function updateDevis(
  documentId: string,
  prevState: ActionState,
  formData: FormData
) {
  return updateDocument("devis", documentId, prevState, formData);
}

export async function updateFacture(
  documentId: string,
  prevState: ActionState,
  formData: FormData
) {
  return updateDocument("facture", documentId, prevState, formData);
}

// --- Transitions de statut -------------------------------------------------

async function findOwnedDocument(tenantId: string, documentId: string) {
  return prisma.document.findFirst({ where: { id: documentId, tenantId } });
}

export async function envoyerDevis(documentId: string): Promise<void> {
  const session = await requireSession();
  const doc = await findOwnedDocument(session.tenantId, documentId);
  if (!doc || doc.type !== "devis" || doc.statut !== "brouillon") return;

  await prisma.document.update({
    where: { id: documentId },
    data: { statut: "envoye", envoyeAt: new Date() },
  });
  revalidatePath("/devis");
  revalidatePath(`/devis/${documentId}`);
}

export async function accepterDevis(documentId: string): Promise<void> {
  const session = await requireSession();
  const doc = await findOwnedDocument(session.tenantId, documentId);
  if (!doc || doc.type !== "devis" || doc.statut !== "envoye") return;

  await prisma.document.update({
    where: { id: documentId },
    data: { statut: "accepte" },
  });
  revalidatePath("/devis");
  revalidatePath(`/devis/${documentId}`);
}

export async function refuserDevis(documentId: string): Promise<void> {
  const session = await requireSession();
  const doc = await findOwnedDocument(session.tenantId, documentId);
  if (!doc || doc.type !== "devis" || doc.statut !== "envoye") return;

  await prisma.document.update({
    where: { id: documentId },
    data: { statut: "refuse" },
  });
  revalidatePath("/devis");
  revalidatePath(`/devis/${documentId}`);
}

export async function envoyerFacture(documentId: string): Promise<void> {
  const session = await requireSession();
  const doc = await findOwnedDocument(session.tenantId, documentId);
  if (!doc || doc.type !== "facture" || doc.statut !== "brouillon") return;

  await prisma.document.update({
    where: { id: documentId },
    data: { statut: "envoye", envoyeAt: new Date() },
  });
  revalidatePath("/factures");
  revalidatePath(`/factures/${documentId}`);
}

/**
 * Devis accepté -> facture : clone les lignes du devis dans une nouvelle
 * facture (nouvelle numérotation, nouveaux snapshots vendeur/acheteur pris
 * sur l'état courant), référence le devis d'origine, et marque le devis
 * comme converti.
 */
export async function convertirDevisEnFacture(devisId: string): Promise<void> {
  const session = await requireSession();

  const devis = await prisma.document.findFirst({
    where: { id: devisId, tenantId: session.tenantId, type: "devis" },
    include: { lignes: { orderBy: { ordre: "asc" } } },
  });
  if (!devis || devis.statut !== "accepte") return;

  const [tenant, client] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId } }),
    prisma.client.findUniqueOrThrow({ where: { id: devis.clientId } }),
  ]);

  const lignes = devis.lignes.map((l) => ({
    quantite: Number(l.quantite),
    prixUnitaireHt: Number(l.prixUnitaireHt),
    tauxTva: l.tauxTva !== null ? Number(l.tauxTva) : null,
    remisePourcentage: Number(l.remisePourcentage),
  }));
  const totaux = calculerTotaux(lignes);

  const dateEmission = new Date();
  const dateEcheance = new Date(dateEmission);
  dateEcheance.setDate(dateEcheance.getDate() + 30);

  const facture = await prisma.$transaction(async (tx) => {
    const numero = await getNextNumero(tx, session.tenantId, "facture" as TypeDocument);
    const nouvelleFacture = await tx.document.create({
      data: {
        tenantId: session.tenantId,
        type: "facture",
        numero,
        statut: "brouillon",
        clientId: client.id,
        refDocumentId: devis.id,
        dateEmission,
        dateEcheance,
        conditionsPaiement: devis.conditionsPaiement,
        tauxPenaliteRetard: 10,
        notes: devis.notes,
        montantHt: totaux.montantHt,
        montantTva: totaux.montantTva,
        montantTtc: totaux.montantTtc,
        emetteurSnapshot: buildEmetteurSnapshot(tenant),
        clientSnapshot: buildClientSnapshot(client),
        createdById: session.userId,
        lignes: {
          create: devis.lignes.map((l, index) => ({
            ordre: index,
            articleId: l.articleId,
            designation: l.designation,
            description: l.description,
            uniteMesure: l.uniteMesure,
            quantite: l.quantite,
            prixUnitaireHt: l.prixUnitaireHt,
            tauxTva: l.tauxTva,
            remisePourcentage: l.remisePourcentage,
            montantHt: l.montantHt,
          })),
        },
      },
    });

    await tx.document.update({
      where: { id: devis.id },
      data: { statut: "converti" },
    });

    return nouvelleFacture;
  });

  revalidatePath("/devis");
  revalidatePath(`/devis/${devisId}`);
  revalidatePath("/factures");
  redirect(`/factures/${facture.id}`);
}
