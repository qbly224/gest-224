"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { annonceSchema } from "@/lib/validation/annonce";
import { paiementBloque, MESSAGE_PAIEMENT_BLOQUE } from "@/lib/paiement-guard";
import { peutAcceder, MESSAGE_ACCES_REFUSE } from "@/lib/permissions";
import { enqueuerEmails } from "@/lib/jobs/email";
import { enregistrerAudit } from "@/lib/audit";
import { withToast } from "@/lib/toast";
import type { ActionState } from "@/lib/actions/types";

export async function createAnnonce(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  if (!peutAcceder(session.role, "annonces")) {
    return { error: MESSAGE_ACCES_REFUSE };
  }

  const parsed = annonceSchema.safeParse({
    titre: formData.get("titre"),
    contenu: formData.get("contenu"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: session.tenantId },
    select: { plan: true, paiementValide: true, raisonSociale: true },
  });
  if (paiementBloque(tenant)) {
    return { error: MESSAGE_PAIEMENT_BLOQUE };
  }

  const annonce = await prisma.annonce.create({
    data: { tenantId: session.tenantId, titre: data.titre, contenu: data.contenu },
  });

  const destinataires = await prisma.membre.findMany({
    where: { tenantId: session.tenantId, actif: true, email: { not: null } },
    select: { email: true },
  });

  await enqueuerEmails(
    session.tenantId,
    destinataires.map((m) => ({
      destinataire: m.email!,
      sujet: `${tenant.raisonSociale} — ${data.titre}`,
      corps: data.contenu,
    }))
  );

  await enregistrerAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: "annonce.diffusee",
    entite: "annonce",
    entiteId: annonce.id,
    details: { titre: data.titre, destinataires: destinataires.length },
  });

  revalidatePath("/annonces");
  redirect(
    withToast(
      "/annonces",
      destinataires.length > 0
        ? `Annonce enregistrée, diffusion en cours vers ${destinataires.length} membre(s).`
        : "Annonce enregistrée (aucun membre avec email à notifier)."
    )
  );
}

export async function supprimerAnnonce(annonceId: string): Promise<void> {
  const session = await requireSession();
  if (!peutAcceder(session.role, "annonces")) return;

  const existing = await prisma.annonce.findFirst({
    where: { id: annonceId, tenantId: session.tenantId },
  });
  if (!existing) return;

  await prisma.annonce.delete({ where: { id: annonceId } });
  await enregistrerAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: "annonce.supprimee",
    entite: "annonce",
    entiteId: annonceId,
    details: { titre: existing.titre },
  });

  revalidatePath("/annonces");
  redirect(withToast("/annonces", "Annonce supprimée."));
}
