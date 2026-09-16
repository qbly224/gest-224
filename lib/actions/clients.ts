"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/lib/validation/client";
import { PLANS } from "@/lib/plans";
import type { ActionState } from "@/lib/actions/types";

function parseClientForm(formData: FormData) {
  return clientSchema.safeParse({
    type: formData.get("type"),
    raisonSociale: formData.get("raisonSociale") || undefined,
    siret: formData.get("siret") || undefined,
    numeroTvaIntracom: formData.get("numeroTvaIntracom") || undefined,
    civilite: formData.get("civilite") || undefined,
    nom: formData.get("nom") || undefined,
    prenom: formData.get("prenom") || undefined,
    adresseLigne1: formData.get("adresseLigne1"),
    adresseLigne2: formData.get("adresseLigne2") || undefined,
    codePostal: formData.get("codePostal"),
    ville: formData.get("ville"),
    pays: formData.get("pays") || "France",
    email: formData.get("email") || undefined,
    telephone: formData.get("telephone") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function createClient(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const parsed = parseClientForm(formData);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: session.tenantId },
    select: { plan: true },
  });
  const limiteClients = PLANS[tenant.plan].limiteClients;
  if (limiteClients !== null) {
    const nbClients = await prisma.client.count({ where: { tenantId: session.tenantId } });
    if (nbClients >= limiteClients) {
      return {
        error: `Limite de ${limiteClients} clients atteinte pour le plan ${PLANS[tenant.plan].label}. Passez à un plan supérieur depuis la page Abonnement pour continuer.`,
      };
    }
  }

  const client = await prisma.client.create({
    data: {
      tenantId: session.tenantId,
      type: data.type,
      raisonSociale: data.raisonSociale || null,
      siret: data.siret || null,
      numeroTvaIntracom: data.numeroTvaIntracom || null,
      civilite: data.civilite || null,
      nom: data.nom || null,
      prenom: data.prenom || null,
      adresseLigne1: data.adresseLigne1,
      adresseLigne2: data.adresseLigne2 || null,
      codePostal: data.codePostal,
      ville: data.ville,
      pays: data.pays,
      email: data.email || null,
      telephone: data.telephone || null,
      notes: data.notes || null,
    },
  });

  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

export async function updateClient(
  clientId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const parsed = parseClientForm(formData);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const existing = await prisma.client.findFirst({
    where: { id: clientId, tenantId: session.tenantId },
  });
  if (!existing) {
    return { error: "Client introuvable." };
  }

  await prisma.client.update({
    where: { id: clientId },
    data: {
      type: data.type,
      raisonSociale: data.raisonSociale || null,
      siret: data.siret || null,
      numeroTvaIntracom: data.numeroTvaIntracom || null,
      civilite: data.civilite || null,
      nom: data.nom || null,
      prenom: data.prenom || null,
      adresseLigne1: data.adresseLigne1,
      adresseLigne2: data.adresseLigne2 || null,
      codePostal: data.codePostal,
      ville: data.ville,
      pays: data.pays,
      email: data.email || null,
      telephone: data.telephone || null,
      notes: data.notes || null,
    },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export async function toggleClientActif(clientId: string): Promise<void> {
  const session = await requireSession();

  const existing = await prisma.client.findFirst({
    where: { id: clientId, tenantId: session.tenantId },
  });
  if (!existing) return;

  await prisma.client.update({
    where: { id: clientId },
    data: { actif: !existing.actif },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
}
