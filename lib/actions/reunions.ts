"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { reunionSchema } from "@/lib/validation/reunion";
import { paiementBloque, MESSAGE_PAIEMENT_BLOQUE } from "@/lib/paiement-guard";
import { withToast } from "@/lib/toast";
import { peutAcceder, MESSAGE_ACCES_REFUSE } from "@/lib/permissions";
import { envoyerEmail } from "@/lib/email";
import type { ActionState } from "@/lib/actions/types";

function parseReunionForm(formData: FormData) {
  return reunionSchema.safeParse({
    titre: formData.get("titre"),
    date: formData.get("date"),
    lieu: formData.get("lieu") || undefined,
    description: formData.get("description") || undefined,
    compteRendu: formData.get("compteRendu") || undefined,
  });
}

export async function createReunion(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  if (!peutAcceder(session.role, "reunions")) {
    return { error: MESSAGE_ACCES_REFUSE };
  }
  const parsed = parseReunionForm(formData);
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

  const reunion = await prisma.reunion.create({
    data: {
      tenantId: session.tenantId,
      titre: data.titre,
      date: new Date(data.date),
      lieu: data.lieu || null,
      description: data.description || null,
      compteRendu: data.compteRendu || null,
    },
  });

  revalidatePath("/reunions");
  redirect(withToast(`/reunions/${reunion.id}`, "Réunion enregistrée."));
}

export async function updateReunion(
  reunionId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  if (!peutAcceder(session.role, "reunions")) {
    return { error: MESSAGE_ACCES_REFUSE };
  }
  const parsed = parseReunionForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const existing = await prisma.reunion.findFirst({
    where: { id: reunionId, tenantId: session.tenantId },
  });
  if (!existing) {
    return { error: "Réunion introuvable." };
  }

  await prisma.reunion.update({
    where: { id: reunionId },
    data: {
      titre: data.titre,
      date: new Date(data.date),
      lieu: data.lieu || null,
      description: data.description || null,
      compteRendu: data.compteRendu || null,
    },
  });

  revalidatePath("/reunions");
  revalidatePath(`/reunions/${reunionId}`);
  return { success: true };
}

export async function supprimerReunion(reunionId: string): Promise<void> {
  const session = await requireSession();
  if (!peutAcceder(session.role, "reunions")) return;
  const existing = await prisma.reunion.findFirst({
    where: { id: reunionId, tenantId: session.tenantId },
  });
  if (!existing) return;

  await prisma.reunion.delete({ where: { id: reunionId } });

  revalidatePath("/reunions");
  redirect(withToast("/reunions", "Réunion supprimée."));
}

/**
 * Remplace la liste des participants inscrits par celle cochée dans le
 * formulaire (ajoute les nouveaux, retire ceux décochés - et leur suivi de
 * présence avec, par cohérence : une personne non inscrite n'a pas de
 * présence à suivre).
 */
export async function synchroniserParticipants(
  reunionId: string,
  formData: FormData
): Promise<void> {
  const session = await requireSession();
  if (!peutAcceder(session.role, "reunions")) return;

  const reunion = await prisma.reunion.findFirst({
    where: { id: reunionId, tenantId: session.tenantId },
  });
  if (!reunion) return;

  const membreIdsCoches = formData.getAll("membreIds").filter((v): v is string => typeof v === "string");
  const membresValides = await prisma.membre.findMany({
    where: { id: { in: membreIdsCoches }, tenantId: session.tenantId },
    select: { id: true },
  });
  const idsValides = membresValides.map((m) => m.id);

  await prisma.$transaction([
    prisma.participantReunion.deleteMany({
      where: { reunionId, membreId: { notIn: idsValides.length > 0 ? idsValides : [""] } },
    }),
    ...idsValides.map((membreId) =>
      prisma.participantReunion.upsert({
        where: { reunionId_membreId: { reunionId, membreId } },
        create: { reunionId, membreId },
        update: {},
      })
    ),
  ]);

  revalidatePath(`/reunions/${reunionId}`);
}

export async function enregistrerPresences(reunionId: string, formData: FormData): Promise<void> {
  const session = await requireSession();
  if (!peutAcceder(session.role, "reunions")) return;

  const reunion = await prisma.reunion.findFirst({
    where: { id: reunionId, tenantId: session.tenantId },
  });
  if (!reunion) return;

  const idsPresents = new Set(
    formData.getAll("presentParticipantIds").filter((v): v is string => typeof v === "string")
  );
  const participants = await prisma.participantReunion.findMany({
    where: { reunionId },
    select: { id: true, present: true },
  });

  await prisma.$transaction(
    participants
      .filter((p) => p.present !== idsPresents.has(p.id))
      .map((p) =>
        prisma.participantReunion.update({
          where: { id: p.id },
          data: { present: idsPresents.has(p.id) },
        })
      )
  );

  revalidatePath(`/reunions/${reunionId}`);
}

/**
 * Diffuse le compte-rendu par email aux participants inscrits ayant une
 * adresse email. Ne redirige volontairement pas vers la liste : reste sur
 * la page pour voir la confirmation de publication.
 */
export async function publierCompteRendu(reunionId: string): Promise<void> {
  const session = await requireSession();
  if (!peutAcceder(session.role, "reunions")) return;

  const reunion = await prisma.reunion.findFirst({
    where: { id: reunionId, tenantId: session.tenantId },
    include: { participants: { include: { membre: true } } },
  });
  if (!reunion || !reunion.compteRendu || reunion.compteRenduPublieA) return;

  await prisma.reunion.update({
    where: { id: reunionId },
    data: { compteRenduPublieA: new Date() },
  });

  const destinataires = reunion.participants
    .map((p) => p.membre.email)
    .filter((email): email is string => Boolean(email));

  await Promise.all(
    destinataires.map((email) =>
      envoyerEmail(
        email,
        `Compte-rendu : ${reunion.titre}`,
        `Le compte-rendu de la réunion "${reunion.titre}" du ${reunion.date.toLocaleDateString("fr-FR")} est disponible :\n\n${reunion.compteRendu}`
      ).catch((err) => console.error("[reunions] Échec d'envoi du compte-rendu:", err))
    )
  );

  revalidatePath(`/reunions/${reunionId}`);
}
