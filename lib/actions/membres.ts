"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { membreSchema } from "@/lib/validation/membre";
import { limitesEffectives } from "@/lib/plans";
import { paiementBloque, MESSAGE_PAIEMENT_BLOQUE } from "@/lib/paiement-guard";
import { withToast } from "@/lib/toast";
import type { ActionState } from "@/lib/actions/types";

function parseMembreForm(formData: FormData) {
  return membreSchema.safeParse({
    civilite: formData.get("civilite") || undefined,
    prenom: formData.get("prenom"),
    nom: formData.get("nom"),
    email: formData.get("email") || undefined,
    telephone: formData.get("telephone") || undefined,
    adresseLigne1: formData.get("adresseLigne1") || undefined,
    adresseLigne2: formData.get("adresseLigne2") || undefined,
    codePostal: formData.get("codePostal") || undefined,
    ville: formData.get("ville") || undefined,
    pays: formData.get("pays") || "France",
    dateAdhesion: formData.get("dateAdhesion"),
    role: formData.get("role"),
    statut: formData.get("statut"),
    notes: formData.get("notes") || undefined,
    relanceFrequence: formData.get("relanceFrequence") || "7",
  });
}

function relanceChampsDepuisFrequence(relanceFrequence: string) {
  return relanceFrequence === "desactivee"
    ? { relancesActivees: false, relanceIntervalleJours: 7 }
    : { relancesActivees: true, relanceIntervalleJours: Number(relanceFrequence) };
}

export async function createMembre(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const parsed = parseMembreForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: session.tenantId },
    select: { plan: true, paiementValide: true, typeCompte: true },
  });
  if (paiementBloque(tenant)) {
    return { error: MESSAGE_PAIEMENT_BLOQUE };
  }
  const plan = limitesEffectives(tenant);
  const limiteMembres = plan.limiteMembres;
  if (limiteMembres !== null) {
    const nbMembres = await prisma.membre.count({ where: { tenantId: session.tenantId } });
    if (nbMembres >= limiteMembres) {
      return {
        error: `Limite de ${limiteMembres} membres atteinte pour le plan ${plan.label}. Passez à un plan supérieur depuis la page Abonnement pour continuer.`,
      };
    }
  }

  const membre = await prisma.membre.create({
    data: {
      tenantId: session.tenantId,
      civilite: data.civilite || null,
      prenom: data.prenom,
      nom: data.nom,
      email: data.email || null,
      telephone: data.telephone || null,
      adresseLigne1: data.adresseLigne1 || null,
      adresseLigne2: data.adresseLigne2 || null,
      codePostal: data.codePostal || null,
      ville: data.ville || null,
      pays: data.pays || "France",
      dateAdhesion: new Date(data.dateAdhesion),
      role: data.role,
      statut: data.statut,
      notes: data.notes || null,
      ...relanceChampsDepuisFrequence(data.relanceFrequence),
    },
  });

  revalidatePath("/membres");
  redirect(withToast(`/membres/${membre.id}`, "Membre enregistré."));
}

export async function updateMembre(
  membreId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const parsed = parseMembreForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const existing = await prisma.membre.findFirst({
    where: { id: membreId, tenantId: session.tenantId },
  });
  if (!existing) {
    return { error: "Membre introuvable." };
  }

  await prisma.membre.update({
    where: { id: membreId },
    data: {
      civilite: data.civilite || null,
      prenom: data.prenom,
      nom: data.nom,
      email: data.email || null,
      telephone: data.telephone || null,
      adresseLigne1: data.adresseLigne1 || null,
      adresseLigne2: data.adresseLigne2 || null,
      codePostal: data.codePostal || null,
      ville: data.ville || null,
      pays: data.pays || "France",
      dateAdhesion: new Date(data.dateAdhesion),
      role: data.role,
      statut: data.statut,
      notes: data.notes || null,
      ...relanceChampsDepuisFrequence(data.relanceFrequence),
    },
  });

  revalidatePath("/membres");
  revalidatePath(`/membres/${membreId}`);
  return { success: true };
}

export async function toggleMembreActif(membreId: string): Promise<void> {
  const session = await requireSession();

  const existing = await prisma.membre.findFirst({
    where: { id: membreId, tenantId: session.tenantId },
  });
  if (!existing) return;

  await prisma.membre.update({
    where: { id: membreId },
    data: { actif: !existing.actif },
  });

  revalidatePath("/membres");
  revalidatePath(`/membres/${membreId}`);
  redirect(withToast("/membres", existing.actif ? "Membre désactivé." : "Membre réactivé."));
}
