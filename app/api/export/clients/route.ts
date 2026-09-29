import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { genererCsv, reponseCsv } from "@/lib/csv";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return new Response("Non authentifié.", { status: 401 });
  }

  const clients = await prisma.client.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: "desc" },
  });

  const csv = genererCsv(
    [
      "Type",
      "Raison sociale",
      "Civilité",
      "Nom",
      "Prénom",
      "SIRET",
      "N° TVA intracom.",
      "Adresse",
      "Complément",
      "Code postal",
      "Ville",
      "Pays",
      "Email",
      "Téléphone",
      "Actif",
    ],
    clients.map((c) => [
      c.type,
      c.raisonSociale,
      c.civilite,
      c.nom,
      c.prenom,
      c.siret,
      c.numeroTvaIntracom,
      c.adresseLigne1,
      c.adresseLigne2,
      c.codePostal,
      c.ville,
      c.pays,
      c.email,
      c.telephone,
      c.actif ? "Oui" : "Non",
    ])
  );

  return reponseCsv(csv, "clients.csv");
}
