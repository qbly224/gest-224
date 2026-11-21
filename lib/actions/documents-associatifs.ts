"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { documentAssociatifSchema } from "@/lib/validation/document-associatif";
import { paiementBloque, MESSAGE_PAIEMENT_BLOQUE } from "@/lib/paiement-guard";
import { peutAcceder, MESSAGE_ACCES_REFUSE } from "@/lib/permissions";
import { enregistrerAudit } from "@/lib/audit";
import { withToast } from "@/lib/toast";
import {
  TYPES_PIECE_JOINTE_AUTORISES,
  TAILLE_PIECE_JOINTE_MAX_OCTETS,
} from "@/lib/depense-pieces-jointes";
import type { ActionState } from "@/lib/actions/types";

export async function ajouterDocumentAssociatif(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  if (!peutAcceder(session.role, "documents")) {
    return { error: MESSAGE_ACCES_REFUSE };
  }

  const parsed = documentAssociatifSchema.safeParse({
    categorie: formData.get("categorie"),
    titre: formData.get("titre"),
  });
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

  const fichier = formData.get("fichier");
  if (!(fichier instanceof File) || fichier.size === 0) {
    return { error: "Choisissez un fichier." };
  }
  if (!TYPES_PIECE_JOINTE_AUTORISES.has(fichier.type)) {
    return { error: "Format non supporté (PDF, PNG, JPEG ou WebP uniquement)." };
  }
  if (fichier.size > TAILLE_PIECE_JOINTE_MAX_OCTETS) {
    return { error: "Le fichier dépasse la taille maximale de 5 Mo." };
  }

  const contenu = Buffer.from(await fichier.arrayBuffer());
  const document = await prisma.documentAssociatif.create({
    data: {
      tenantId: session.tenantId,
      categorie: data.categorie,
      titre: data.titre,
      nomFichier: fichier.name,
      typeMime: fichier.type,
      tailleOctets: fichier.size,
      contenu,
    },
  });
  await enregistrerAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: "document_associatif.ajoute",
    entite: "document_associatif",
    entiteId: document.id,
    details: { titre: data.titre, categorie: data.categorie },
  });

  revalidatePath("/documents");
  redirect(withToast("/documents", "Document ajouté à l'archive."));
}

export async function supprimerDocumentAssociatif(documentId: string): Promise<void> {
  const session = await requireSession();
  if (!peutAcceder(session.role, "documents")) return;

  const existing = await prisma.documentAssociatif.findFirst({
    where: { id: documentId, tenantId: session.tenantId },
  });
  if (!existing) return;

  await prisma.documentAssociatif.delete({ where: { id: documentId } });
  await enregistrerAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: "document_associatif.supprime",
    entite: "document_associatif",
    entiteId: documentId,
    details: { titre: existing.titre },
  });

  revalidatePath("/documents");
  redirect(withToast("/documents", "Document supprimé."));
}
