"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { TypeDocument, Document, DocumentLigne } from "@prisma/client";
import { STATUTS_MODIFIABLES } from "@/lib/documents/statuts-modifiables";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import type { SessionPayload } from "@/lib/session";
import { documentBaseSchema, documentAvoirSchema } from "@/lib/validation/document";
import { calculerMontantLigneHt, calculerTotaux } from "@/lib/documents/calc";
import { getNextNumero } from "@/lib/documents/numbering";
import { buildEmetteurSnapshot, buildClientSnapshot } from "@/lib/documents/snapshot";
import { compterDocumentsMoisCourant } from "@/lib/documents/usage";
import { PLANS } from "@/lib/plans";
import { paiementBloque, MESSAGE_PAIEMENT_BLOQUE } from "@/lib/paiement-guard";
import { withToast } from "@/lib/toast";
import { TITRES_DOCUMENT } from "@/lib/documents/statut-labels";
import type { ActionState } from "@/lib/actions/types";
import { enregistrerAudit } from "@/lib/audit";
import { getTranslations, getLocale } from "next-intl/server";
import { renderDocumentHtml } from "@/lib/pdf/template";
import { genererPdf } from "@/lib/pdf/generate";
import { envoyerEmail } from "@/lib/email";
import { formatEuros } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import type { ClientSnapshot, EmetteurSnapshot } from "@/lib/documents/snapshot";

// Types créés/modifiés via le formulaire générique (lignes à quantité
// positive). L'avoir a son propre schéma/actions (quantités négatives).
type TypeDocumentSaisi = "devis" | "bon_commande" | "bon_livraison" | "facture" | "facture_acompte";

const BASE_PATH: Record<TypeDocument, string> = {
  devis: "/devis",
  bon_commande: "/bons-commande",
  bon_livraison: "/bons-livraison",
  facture: "/factures",
  facture_acompte: "/factures-acompte",
  facture_avoir: "/avoirs",
};

// Types de facture portant échéance/pénalités de retard (mentions dues au
// vendeur). L'avoir, qui rembourse le client, n'en porte pas.
function porteMentionsFacture(type: TypeDocument): boolean {
  return type === "facture" || type === "facture_acompte";
}

function extraireChampsFormulaire(formData: FormData) {
  let lignesParsed: unknown = [];
  try {
    lignesParsed = JSON.parse(String(formData.get("lignesJson") ?? "[]"));
  } catch {
    lignesParsed = [];
  }
  return {
    clientId: formData.get("clientId"),
    dateEmission: formData.get("dateEmission"),
    dateEcheance: formData.get("dateEcheance") || undefined,
    conditionsPaiement: formData.get("conditionsPaiement") || undefined,
    tauxPenaliteRetard: formData.get("tauxPenaliteRetard") || undefined,
    notes: formData.get("notes") || undefined,
    lignes: lignesParsed,
  };
}

function parseDocumentForm(formData: FormData) {
  return documentBaseSchema.safeParse(extraireChampsFormulaire(formData));
}

function parseAvoirForm(formData: FormData) {
  return documentAvoirSchema.safeParse(extraireChampsFormulaire(formData));
}

async function createDocument(
  type: TypeDocumentSaisi,
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
  if (paiementBloque(tenant)) {
    return { error: MESSAGE_PAIEMENT_BLOQUE };
  }

  const limiteDocuments = PLANS[tenant.plan].limiteDocumentsParMois;
  if (limiteDocuments !== null) {
    const nbCeMois = await compterDocumentsMoisCourant(session.tenantId);
    if (nbCeMois >= limiteDocuments) {
      return {
        error: `Limite de ${limiteDocuments} documents par mois atteinte pour le plan ${PLANS[tenant.plan].label}. Passez à un plan supérieur depuis la page Abonnement pour continuer.`,
      };
    }
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
        tauxPenaliteRetard: porteMentionsFacture(type) ? data.tauxPenaliteRetard ?? 10 : null,
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
  redirect(
    withToast(`${BASE_PATH[type]}/${document.id}`, `${TITRES_DOCUMENT[type]} créé en brouillon.`)
  );
}

export async function createDevis(prevState: ActionState, formData: FormData) {
  return createDocument("devis", prevState, formData);
}
export async function createBonCommande(prevState: ActionState, formData: FormData) {
  return createDocument("bon_commande", prevState, formData);
}
export async function createBonLivraison(prevState: ActionState, formData: FormData) {
  return createDocument("bon_livraison", prevState, formData);
}
export async function createFacture(prevState: ActionState, formData: FormData) {
  return createDocument("facture", prevState, formData);
}
export async function createFactureAcompte(prevState: ActionState, formData: FormData) {
  return createDocument("facture_acompte", prevState, formData);
}

async function updateDocument(
  type: TypeDocumentSaisi,
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
  if (!STATUTS_MODIFIABLES[type].includes(existing.statut)) {
    return {
      error:
        type === "facture" || type === "facture_acompte"
          ? "Cette facture a déjà été émise : ses mentions légales et sa numérotation ne peuvent plus être modifiées. Pour corriger une erreur, créez un avoir puis une nouvelle facture."
          : "Ce document ne peut plus être modifié dans son état actuel.",
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
        tauxPenaliteRetard: porteMentionsFacture(type) ? data.tauxPenaliteRetard ?? 10 : null,
        notes: data.notes || null,
        montantHt: totaux.montantHt,
        montantTva: totaux.montantTva,
        montantTtc: totaux.montantTtc,
        // Toujours réactualisé : pour "brouillon" comme pour "envoyé" (devis/
        // bons), les mentions légales vendeur/acheteur ne sont pas encore
        // figées tant que ce n'est pas une facture.
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

export async function updateDevis(documentId: string, prevState: ActionState, formData: FormData) {
  return updateDocument("devis", documentId, prevState, formData);
}
export async function updateBonCommande(documentId: string, prevState: ActionState, formData: FormData) {
  return updateDocument("bon_commande", documentId, prevState, formData);
}
export async function updateBonLivraison(documentId: string, prevState: ActionState, formData: FormData) {
  return updateDocument("bon_livraison", documentId, prevState, formData);
}
export async function updateFacture(documentId: string, prevState: ActionState, formData: FormData) {
  return updateDocument("facture", documentId, prevState, formData);
}
export async function updateFactureAcompte(documentId: string, prevState: ActionState, formData: FormData) {
  return updateDocument("facture_acompte", documentId, prevState, formData);
}

/**
 * Un avoir a ses propres lignes (quantités pouvant être négatives, le prix
 * unitaire reste positif) et ne porte ni échéance ni pénalités de retard.
 */
export async function updateAvoir(
  documentId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const parsed = parseAvoirForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const existing = await prisma.document.findFirst({
    where: { id: documentId, tenantId: session.tenantId, type: "facture_avoir" },
  });
  if (!existing) {
    return { error: "Avoir introuvable." };
  }
  if (existing.statut !== "brouillon") {
    return {
      error:
        "Cet avoir a déjà été validé : ses mentions légales et sa numérotation ne peuvent plus être modifiées.",
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
        conditionsPaiement: data.conditionsPaiement || null,
        notes: data.notes || null,
        montantHt: totaux.montantHt,
        montantTva: totaux.montantTva,
        montantTtc: totaux.montantTtc,
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

  revalidatePath("/avoirs");
  revalidatePath(`/avoirs/${documentId}`);
  return { success: true };
}

// --- Transitions de statut -------------------------------------------------

async function findOwnedDocument(tenantId: string, documentId: string) {
  return prisma.document.findFirst({ where: { id: documentId, tenantId } });
}

async function marquerEnvoye(type: TypeDocument, documentId: string): Promise<void> {
  const session = await requireSession();
  const doc = await findOwnedDocument(session.tenantId, documentId);
  if (!doc || doc.type !== type || doc.statut !== "brouillon") return;

  await prisma.document.update({
    where: { id: documentId },
    data: { statut: "envoye", envoyeAt: new Date() },
  });
  await enregistrerAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: "document.envoye",
    entite: type,
    entiteId: documentId,
    details: { numero: doc.numero },
  });
  revalidatePath(BASE_PATH[type]);
  revalidatePath(`${BASE_PATH[type]}/${documentId}`);
  redirect(withToast(`${BASE_PATH[type]}/${documentId}`, `${TITRES_DOCUMENT[type]} marqué envoyé.`));
}

export async function envoyerDevis(documentId: string): Promise<void> {
  return marquerEnvoye("devis", documentId);
}
export async function envoyerBonCommande(documentId: string): Promise<void> {
  return marquerEnvoye("bon_commande", documentId);
}
export async function envoyerBonLivraison(documentId: string): Promise<void> {
  return marquerEnvoye("bon_livraison", documentId);
}
export async function envoyerFacture(documentId: string): Promise<void> {
  return marquerEnvoye("facture", documentId);
}
export async function envoyerFactureAcompte(documentId: string): Promise<void> {
  return marquerEnvoye("facture_acompte", documentId);
}
export async function envoyerAvoir(documentId: string): Promise<void> {
  return marquerEnvoye("facture_avoir", documentId);
}

/**
 * Renvoi d'un document déjà envoyé (client qui a perdu l'email, erreur
 * d'adresse, etc.) : contrairement à marquerEnvoye(), ne change pas le
 * statut ni envoyeAt - uniquement une trace d'audit, le document reste
 * dans l'état où il était.
 */
async function renvoyer(type: TypeDocument, documentId: string): Promise<void> {
  const session = await requireSession();
  const doc = await findOwnedDocument(session.tenantId, documentId);
  if (!doc || doc.type !== type || doc.statut === "brouillon") return;

  await enregistrerAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: "document.renvoye",
    entite: type,
    entiteId: documentId,
    details: { numero: doc.numero },
  });
  redirect(withToast(`${BASE_PATH[type]}/${documentId}`, `${TITRES_DOCUMENT[type]} renvoyé.`));
}

export async function renvoyerDevis(documentId: string): Promise<void> {
  return renvoyer("devis", documentId);
}
export async function renvoyerBonCommande(documentId: string): Promise<void> {
  return renvoyer("bon_commande", documentId);
}
export async function renvoyerBonLivraison(documentId: string): Promise<void> {
  return renvoyer("bon_livraison", documentId);
}
export async function renvoyerFacture(documentId: string): Promise<void> {
  return renvoyer("facture", documentId);
}
export async function renvoyerFactureAcompte(documentId: string): Promise<void> {
  return renvoyer("facture_acompte", documentId);
}
export async function renvoyerAvoir(documentId: string): Promise<void> {
  return renvoyer("facture_avoir", documentId);
}

export type EtatEnvoiEmail = { success: boolean; error?: string; destinataire?: string };

// Types facturables où le montant n'a pas sa place dans l'email (le bon de
// livraison n'est pas un document de paiement) - même règle que PdfActions.
const MASQUER_MONTANT_EMAIL: Partial<Record<TypeDocument, true>> = {
  bon_livraison: true,
};

/**
 * Envoi (ou renvoi) d'un document par email avec le PDF en pièce jointe,
 * généré et envoyé directement depuis le serveur via Resend - contrairement
 * à EnvoyerActions (Gmail/WhatsApp), qui ouvre juste un brouillon côté
 * client sans joindre automatiquement le fichier (il faut le télécharger
 * et le joindre à la main).
 *
 * Met à jour le statut/envoyeAt seulement pour un premier envoi (brouillon) ;
 * un renvoi n'y touche pas, comme renvoyer() ci-dessus.
 */
async function envoyerParEmailAutomatique(
  type: TypeDocument,
  documentId: string
): Promise<EtatEnvoiEmail> {
  const session = await requireSession();
  const doc = await prisma.document.findFirst({
    where: { id: documentId, tenantId: session.tenantId, type },
    include: {
      lignes: { orderBy: { ordre: "asc" } },
      refDocument: { select: { numero: true, type: true } },
    },
  });
  if (!doc) return { success: false, error: "Document introuvable." };

  const client = doc.clientSnapshot as unknown as ClientSnapshot;
  const emetteur = doc.emetteurSnapshot as unknown as EmetteurSnapshot;
  if (!client.email) {
    return { success: false, error: "Ce client n'a pas d'adresse email enregistrée." };
  }

  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("app.envoyerActions");
  const titre = TITRES_DOCUMENT[type];
  const sujet = t("emailSujet", { titre, numero: doc.numero, raisonSociale: emetteur.raisonSociale });
  const mentionMontant = MASQUER_MONTANT_EMAIL[type]
    ? ""
    : t("emailMontant", { montant: formatEuros(Math.abs(Number(doc.montantTtc)), locale) });
  const corps = t("emailCorpsAutoJoint", {
    titre: titre.toLowerCase(),
    numero: doc.numero,
    mentionMontant,
    raisonSociale: emetteur.raisonSociale,
  });

  const pdf = await genererPdf(renderDocumentHtml(doc));

  try {
    await envoyerEmail(client.email, sujet, corps, [
      { nomFichier: `${doc.numero}.pdf`, contenu: pdf },
    ]);
  } catch (erreur) {
    return {
      success: false,
      error: erreur instanceof Error ? erreur.message : "Échec de l'envoi de l'email.",
    };
  }

  const premierEnvoi = doc.statut === "brouillon";
  if (premierEnvoi) {
    await prisma.document.update({
      where: { id: documentId },
      data: { statut: "envoye", envoyeAt: new Date() },
    });
  }
  await enregistrerAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: premierEnvoi ? "document.envoye" : "document.renvoye",
    entite: type,
    entiteId: documentId,
    details: { numero: doc.numero, methode: "email_automatique" },
  });
  revalidatePath(BASE_PATH[type]);
  revalidatePath(`${BASE_PATH[type]}/${documentId}`);

  return { success: true, destinataire: client.email };
}

export async function envoyerDevisParEmail(documentId: string): Promise<EtatEnvoiEmail> {
  return envoyerParEmailAutomatique("devis", documentId);
}
export async function envoyerBonCommandeParEmail(documentId: string): Promise<EtatEnvoiEmail> {
  return envoyerParEmailAutomatique("bon_commande", documentId);
}
export async function envoyerBonLivraisonParEmail(documentId: string): Promise<EtatEnvoiEmail> {
  return envoyerParEmailAutomatique("bon_livraison", documentId);
}
export async function envoyerFactureParEmail(documentId: string): Promise<EtatEnvoiEmail> {
  return envoyerParEmailAutomatique("facture", documentId);
}
export async function envoyerFactureAcompteParEmail(documentId: string): Promise<EtatEnvoiEmail> {
  return envoyerParEmailAutomatique("facture_acompte", documentId);
}
export async function envoyerAvoirParEmail(documentId: string): Promise<EtatEnvoiEmail> {
  return envoyerParEmailAutomatique("facture_avoir", documentId);
}

export async function accepterDevis(documentId: string): Promise<void> {
  const session = await requireSession();
  const doc = await findOwnedDocument(session.tenantId, documentId);
  if (!doc || doc.type !== "devis" || doc.statut !== "envoye") return;

  await prisma.document.update({ where: { id: documentId }, data: { statut: "accepte" } });
  await enregistrerAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: "devis.accepte",
    entite: "devis",
    entiteId: documentId,
    details: { numero: doc.numero },
  });
  revalidatePath("/devis");
  revalidatePath(`/devis/${documentId}`);
  redirect(withToast(`/devis/${documentId}`, "Devis marqué accepté."));
}

export async function refuserDevis(documentId: string): Promise<void> {
  const session = await requireSession();
  const doc = await findOwnedDocument(session.tenantId, documentId);
  if (!doc || doc.type !== "devis" || doc.statut !== "envoye") return;

  await prisma.document.update({ where: { id: documentId }, data: { statut: "refuse" } });
  await enregistrerAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: "devis.refuse",
    entite: "devis",
    entiteId: documentId,
    details: { numero: doc.numero },
  });
  revalidatePath("/devis");
  revalidatePath(`/devis/${documentId}`);
  redirect(withToast(`/devis/${documentId}`, "Devis marqué refusé."));
}

export async function marquerBonLivraisonLivre(documentId: string): Promise<void> {
  const session = await requireSession();
  const doc = await findOwnedDocument(session.tenantId, documentId);
  if (!doc || doc.type !== "bon_livraison" || doc.statut !== "envoye") return;

  await prisma.document.update({ where: { id: documentId }, data: { statut: "livre" } });
  await enregistrerAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: "bon_livraison.livre",
    entite: "bon_livraison",
    entiteId: documentId,
    details: { numero: doc.numero },
  });
  revalidatePath("/bons-livraison");
  revalidatePath(`/bons-livraison/${documentId}`);
  redirect(withToast(`/bons-livraison/${documentId}`, "Bon de livraison marqué livré."));
}

// --- Chaîne documentaire : conversions --------------------------------------

/**
 * Clone les lignes d'un document source vers un document du type suivant
 * dans la chaîne (nouvelle numérotation, nouveaux snapshots vendeur/acheteur
 * pris sur l'état courant, référence conservée vers le document d'origine),
 * puis marque le document source comme "converti".
 */
async function clonerVersNouveauType(
  session: SessionPayload,
  source: Document & { lignes: DocumentLigne[] },
  nouveauType: TypeDocument,
  options: { dateEcheanceJours?: number; tauxPenaliteRetard?: number | null } = {}
) {
  const [tenant, client] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId } }),
    prisma.client.findFirstOrThrow({
      where: { id: source.clientId, tenantId: session.tenantId },
    }),
  ]);

  const lignesCalc = source.lignes.map((l) => ({
    quantite: Number(l.quantite),
    prixUnitaireHt: Number(l.prixUnitaireHt),
    tauxTva: l.tauxTva !== null ? Number(l.tauxTva) : null,
    remisePourcentage: Number(l.remisePourcentage),
  }));
  const totaux = calculerTotaux(lignesCalc);

  const dateEmission = new Date();
  const dateEcheance = options.dateEcheanceJours
    ? new Date(dateEmission.getTime() + options.dateEcheanceJours * 86_400_000)
    : null;

  const document = await prisma.$transaction(async (tx) => {
    const numero = await getNextNumero(tx, session.tenantId, nouveauType);
    const nouveauDocument = await tx.document.create({
      data: {
        tenantId: session.tenantId,
        type: nouveauType,
        numero,
        statut: "brouillon",
        clientId: client.id,
        refDocumentId: source.id,
        dateEmission,
        dateEcheance,
        conditionsPaiement: source.conditionsPaiement,
        tauxPenaliteRetard: options.tauxPenaliteRetard ?? null,
        notes: source.notes,
        montantHt: totaux.montantHt,
        montantTva: totaux.montantTva,
        montantTtc: totaux.montantTtc,
        emetteurSnapshot: buildEmetteurSnapshot(tenant),
        clientSnapshot: buildClientSnapshot(client),
        createdById: session.userId,
        lignes: {
          create: source.lignes.map((l, index) => ({
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

    await tx.document.update({ where: { id: source.id }, data: { statut: "converti" } });

    return nouveauDocument;
  });

  await enregistrerAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: "document.converti",
    entite: nouveauType,
    entiteId: document.id,
    details: { depuisType: source.type, depuisId: source.id, numero: document.numero },
  });

  return document;
}

/** Devis accepté -> facture (raccourci direct, sans passer par BC/BL). */
export async function convertirDevisEnFacture(devisId: string): Promise<void> {
  const session = await requireSession();
  const devis = await prisma.document.findFirst({
    where: { id: devisId, tenantId: session.tenantId, type: "devis" },
    include: { lignes: { orderBy: { ordre: "asc" } } },
  });
  if (!devis || devis.statut !== "accepte") return;

  const facture = await clonerVersNouveauType(session, devis, "facture", {
    dateEcheanceJours: 30,
    tauxPenaliteRetard: 10,
  });

  revalidatePath("/devis");
  revalidatePath(`/devis/${devisId}`);
  revalidatePath("/factures");
  redirect(withToast(`/factures/${facture.id}`, "Devis converti en facture."));
}

/** Devis accepté -> bon de commande. */
export async function convertirDevisEnBonCommande(devisId: string): Promise<void> {
  const session = await requireSession();
  const devis = await prisma.document.findFirst({
    where: { id: devisId, tenantId: session.tenantId, type: "devis" },
    include: { lignes: { orderBy: { ordre: "asc" } } },
  });
  if (!devis || devis.statut !== "accepte") return;

  const bonCommande = await clonerVersNouveauType(session, devis, "bon_commande");

  revalidatePath("/devis");
  revalidatePath(`/devis/${devisId}`);
  revalidatePath("/bons-commande");
  redirect(withToast(`/bons-commande/${bonCommande.id}`, "Devis converti en bon de commande."));
}

/** Bon de commande envoyé -> bon de livraison. */
export async function convertirBonCommandeEnBonLivraison(bonCommandeId: string): Promise<void> {
  const session = await requireSession();
  const bonCommande = await prisma.document.findFirst({
    where: { id: bonCommandeId, tenantId: session.tenantId, type: "bon_commande" },
    include: { lignes: { orderBy: { ordre: "asc" } } },
  });
  if (!bonCommande || bonCommande.statut !== "envoye") return;

  const bonLivraison = await clonerVersNouveauType(session, bonCommande, "bon_livraison");

  revalidatePath("/bons-commande");
  revalidatePath(`/bons-commande/${bonCommandeId}`);
  revalidatePath("/bons-livraison");
  redirect(
    withToast(`/bons-livraison/${bonLivraison.id}`, "Bon de commande converti en bon de livraison.")
  );
}

/** Bon de livraison livré -> facture. */
export async function convertirBonLivraisonEnFacture(bonLivraisonId: string): Promise<void> {
  const session = await requireSession();
  const bonLivraison = await prisma.document.findFirst({
    where: { id: bonLivraisonId, tenantId: session.tenantId, type: "bon_livraison" },
    include: { lignes: { orderBy: { ordre: "asc" } } },
  });
  if (!bonLivraison || bonLivraison.statut !== "livre") return;

  const facture = await clonerVersNouveauType(session, bonLivraison, "facture", {
    dateEcheanceJours: 30,
    tauxPenaliteRetard: 10,
  });

  revalidatePath("/bons-livraison");
  revalidatePath(`/bons-livraison/${bonLivraisonId}`);
  revalidatePath("/factures");
  redirect(withToast(`/factures/${facture.id}`, "Bon de livraison converti en facture."));
}

/**
 * Facture (déjà émise) -> avoir : clone les lignes avec les quantités
 * inversées (le prix unitaire reste positif, comme au catalogue), pour que
 * les totaux de l'avoir ressortent négatifs - le montant à déduire. La
 * facture d'origine n'est pas marquée "convertie" : plusieurs avoirs
 * peuvent être émis contre une même facture (avoirs partiels successifs).
 */
export async function creerAvoirDepuisFacture(factureId: string): Promise<void> {
  const session = await requireSession();
  const facture = await prisma.document.findFirst({
    where: { id: factureId, tenantId: session.tenantId, type: "facture" },
    include: { lignes: { orderBy: { ordre: "asc" } } },
  });
  if (!facture || facture.statut === "brouillon") return;

  const [tenant, client] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId } }),
    prisma.client.findFirstOrThrow({
      where: { id: facture.clientId, tenantId: session.tenantId },
    }),
  ]);

  const lignesCalc = facture.lignes.map((l) => ({
    quantite: -Number(l.quantite),
    prixUnitaireHt: Number(l.prixUnitaireHt),
    tauxTva: l.tauxTva !== null ? Number(l.tauxTva) : null,
    remisePourcentage: Number(l.remisePourcentage),
  }));
  const totaux = calculerTotaux(lignesCalc);

  const avoir = await prisma.$transaction(async (tx) => {
    const numero = await getNextNumero(tx, session.tenantId, "facture_avoir");
    return tx.document.create({
      data: {
        tenantId: session.tenantId,
        type: "facture_avoir",
        numero,
        statut: "brouillon",
        clientId: client.id,
        refDocumentId: facture.id,
        dateEmission: new Date(),
        conditionsPaiement: facture.conditionsPaiement,
        notes: facture.notes,
        montantHt: totaux.montantHt,
        montantTva: totaux.montantTva,
        montantTtc: totaux.montantTtc,
        emetteurSnapshot: buildEmetteurSnapshot(tenant),
        clientSnapshot: buildClientSnapshot(client),
        createdById: session.userId,
        lignes: {
          create: facture.lignes.map((l, index) => ({
            ordre: index,
            articleId: l.articleId,
            designation: l.designation,
            description: l.description,
            uniteMesure: l.uniteMesure,
            quantite: l.quantite.negated(),
            prixUnitaireHt: l.prixUnitaireHt,
            tauxTva: l.tauxTva,
            remisePourcentage: l.remisePourcentage,
            montantHt: l.montantHt.negated(),
          })),
        },
      },
    });
  });

  await enregistrerAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: "avoir.cree",
    entite: "facture_avoir",
    entiteId: avoir.id,
    details: { depuisFactureId: facture.id, numero: avoir.numero },
  });

  revalidatePath("/factures");
  revalidatePath(`/factures/${factureId}`);
  revalidatePath("/avoirs");
  redirect(withToast(`/avoirs/${avoir.id}`, "Avoir créé en brouillon."));
}

// --- Duplication -------------------------------------------------------

/**
 * Reprend les lignes d'un document existant (quel que soit son statut) dans
 * un nouveau document du même type, en brouillon, avec une nouvelle
 * numérotation et les données vendeur/client actualisées. Contrairement à
 * une conversion, le document source n'est pas modifié et n'est pas lié au
 * nouveau (pas de refDocumentId) : c'est un point de départ indépendant.
 */
export async function dupliquerDocument(documentId: string): Promise<void> {
  const session = await requireSession();

  const source = await prisma.document.findFirst({
    where: { id: documentId, tenantId: session.tenantId },
    include: { lignes: { orderBy: { ordre: "asc" } } },
  });
  if (!source) return;

  const [tenant, client] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId } }),
    prisma.client.findFirst({ where: { id: source.clientId, tenantId: session.tenantId } }),
  ]);
  if (!client) {
    redirect(withToast(`${BASE_PATH[source.type]}/${documentId}`, "Client introuvable."));
  }
  if (paiementBloque(tenant)) {
    redirect(withToast(`${BASE_PATH[source.type]}/${documentId}`, MESSAGE_PAIEMENT_BLOQUE));
  }

  const limiteDocuments = PLANS[tenant.plan].limiteDocumentsParMois;
  if (limiteDocuments !== null) {
    const nbCeMois = await compterDocumentsMoisCourant(session.tenantId);
    if (nbCeMois >= limiteDocuments) {
      redirect(
        withToast(
          `${BASE_PATH[source.type]}/${documentId}`,
          `Limite de ${limiteDocuments} documents par mois atteinte pour le plan ${PLANS[tenant.plan].label}.`
        )
      );
    }
  }

  const dateEmission = new Date();
  const dateEcheance = source.dateEcheance
    ? new Date(dateEmission.getTime() + 30 * 86_400_000)
    : null;

  const nouveauDocument = await prisma.$transaction(async (tx) => {
    const numero = await getNextNumero(tx, session.tenantId, source.type);
    return tx.document.create({
      data: {
        tenantId: session.tenantId,
        type: source.type,
        numero,
        statut: "brouillon",
        clientId: client.id,
        dateEmission,
        dateEcheance,
        conditionsPaiement: source.conditionsPaiement,
        tauxPenaliteRetard: source.tauxPenaliteRetard,
        notes: source.notes,
        montantHt: source.montantHt,
        montantTva: source.montantTva,
        montantTtc: source.montantTtc,
        emetteurSnapshot: buildEmetteurSnapshot(tenant),
        clientSnapshot: buildClientSnapshot(client),
        createdById: session.userId,
        lignes: {
          create: source.lignes.map((l, index) => ({
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
  });

  revalidatePath(BASE_PATH[source.type]);
  redirect(
    withToast(
      `${BASE_PATH[source.type]}/${nouveauDocument.id}`,
      `${TITRES_DOCUMENT[source.type]} dupliqué en brouillon.`
    )
  );
}
