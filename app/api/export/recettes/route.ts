import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { genererCsv, reponseCsv } from "@/lib/csv";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return new Response("Non authentifié.", { status: 401 });
  }

  const recettes = await prisma.recette.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { datePaiement: "desc" },
    include: { document: { select: { numero: true, type: true } } },
  });

  const csv = genererCsv(
    ["Date de paiement", "Document", "Type", "Montant (€)"],
    recettes.map((r) => [
      r.datePaiement.toISOString().slice(0, 10),
      r.document.numero,
      r.document.type,
      r.montant.toString(),
    ])
  );

  return reponseCsv(csv, "recettes.csv");
}
