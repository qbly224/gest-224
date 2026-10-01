import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { genererFec, nomFichierFec } from "@/lib/fec/generer";
import { enregistrerAudit } from "@/lib/audit";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return new Response("Non authentifié.", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateDebutStr = searchParams.get("dateDebut");
  const dateFinStr = searchParams.get("dateFin");
  if (!dateDebutStr || !dateFinStr) {
    return new Response("Paramètres dateDebut et dateFin requis.", { status: 400 });
  }

  const dateDebut = new Date(dateDebutStr);
  const dateFin = new Date(`${dateFinStr}T23:59:59.999`);
  if (Number.isNaN(dateDebut.getTime()) || Number.isNaN(dateFin.getTime()) || dateDebut > dateFin) {
    return new Response("Période invalide.", { status: 400 });
  }

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: session.tenantId },
    select: { siret: true, siren: true },
  });

  const { contenu, nbEcritures } = await genererFec(session.tenantId, dateDebut, dateFin);
  const nomFichier = nomFichierFec(tenant.siret, tenant.siren, dateFin);

  await enregistrerAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: "fec.exporte",
    entite: "tenant",
    entiteId: session.tenantId,
    details: { dateDebut: dateDebutStr, dateFin: dateFinStr, nbEcritures },
  });

  return new Response(contenu, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomFichier}"`,
    },
  });
}
