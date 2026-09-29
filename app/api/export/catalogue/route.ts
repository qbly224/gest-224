import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { genererCsv, reponseCsv } from "@/lib/csv";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return new Response("Non authentifié.", { status: 401 });
  }

  const articles = await prisma.article.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: "desc" },
  });

  const csv = genererCsv(
    ["Type", "Référence", "Désignation", "Description", "Unité", "Prix unitaire HT", "Taux TVA", "Actif"],
    articles.map((a) => [
      a.type,
      a.reference,
      a.designation,
      a.description,
      a.uniteMesure,
      a.prixUnitaireHt.toString(),
      a.tauxTva ? a.tauxTva.toString() : "",
      a.actif ? "Oui" : "Non",
    ])
  );

  return reponseCsv(csv, "catalogue.csv");
}
