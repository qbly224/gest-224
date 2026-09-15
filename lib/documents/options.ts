import "server-only";
import { prisma } from "@/lib/prisma";
import type { ClientOption, ArticleOption } from "@/components/documents/document-form";

export async function listerClientsOptions(tenantId: string): Promise<ClientOption[]> {
  const clients = await prisma.client.findMany({
    where: { tenantId, actif: true },
    orderBy: { createdAt: "desc" },
  });
  return clients.map((c) => ({
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
    orderBy: { designation: "asc" },
  });
  return articles.map((a) => ({
    id: a.id,
    designation: a.designation,
    prixUnitaireHt: a.prixUnitaireHt.toString(),
    tauxTva: a.tauxTva ? a.tauxTva.toString() : null,
    uniteMesure: a.uniteMesure,
  }));
}
