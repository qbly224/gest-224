import "server-only";
import { prisma } from "@/lib/prisma";
import type { ClientOption, ArticleOption } from "@/components/documents/document-form";

/**
 * Trie par usage récent (dernier document/ligne utilisant l'entrée) plutôt
 * que par date de création : c'est ce qui rend les listes déroulantes du
 * formulaire document utiles — le client ou l'article qu'on vient
 * d'utiliser remonte en tête au lieu d'être noyé dans la liste.
 */
export async function listerClientsOptions(tenantId: string): Promise<ClientOption[]> {
  const clients = await prisma.client.findMany({
    where: { tenantId, actif: true },
    include: {
      documents: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  const tries = clients
    .map((c) => ({ ...c, dernierUsage: c.documents[0]?.createdAt ?? c.createdAt }))
    .sort((a, b) => b.dernierUsage.getTime() - a.dernierUsage.getTime());

  return tries.map((c) => ({
    id: c.id,
    label:
      c.type === "professionnel"
        ? c.raisonSociale ?? "—"
        : [c.civilite, c.prenom, c.nom].filter(Boolean).join(" ") || "—",
  }));
}

export async function listerArticlesOptions(tenantId: string): Promise<ArticleOption[]> {
  const articles = await prisma.article.findMany({
    where: { tenantId, actif: true },
    include: {
      documentLignes: {
        orderBy: { document: { createdAt: "desc" } },
        take: 1,
        select: { document: { select: { createdAt: true } } },
      },
    },
  });

  const tries = articles
    .map((a) => ({ ...a, dernierUsage: a.documentLignes[0]?.document.createdAt ?? a.createdAt }))
    .sort((a, b) => b.dernierUsage.getTime() - a.dernierUsage.getTime());

  return tries.map((a) => ({
    id: a.id,
    designation: a.designation,
    prixUnitaireHt: a.prixUnitaireHt.toString(),
    tauxTva: a.tauxTva ? a.tauxTva.toString() : null,
    uniteMesure: a.uniteMesure,
  }));
}
