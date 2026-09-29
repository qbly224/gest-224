import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { genererCsv, reponseCsv } from "@/lib/csv";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return new Response("Non authentifié.", { status: 401 });
  }

  const depenses = await prisma.depense.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { date: "desc" },
  });

  const csv = genererCsv(
    ["Date", "Libellé", "Catégorie", "Montant (€)"],
    depenses.map((d) => [
      d.date.toISOString().slice(0, 10),
      d.libelle,
      d.categorie,
      d.montant.toString(),
    ])
  );

  return reponseCsv(csv, "depenses.csv");
}
