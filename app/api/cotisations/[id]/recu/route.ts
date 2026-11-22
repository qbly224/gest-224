import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { renderRecuHtml } from "@/lib/pdf/recu-template";
import { genererPdf } from "@/lib/pdf/generate";
import { autoriserGenerationPdf, MESSAGE_LIMITE_PDF } from "@/lib/pdf/limite";
import { LABELS_MOYEN_PAIEMENT, estMoyenPaiementValide } from "@/lib/paiement-moyens";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;
  const telecharger = new URL(request.url).searchParams.get("telecharger") === "1";

  const cotisation = await prisma.cotisation.findFirst({
    where: { id, tenantId: session.tenantId },
    include: {
      membre: { select: { civilite: true, prenom: true, nom: true } },
      tenant: {
        select: {
          raisonSociale: true,
          numeroRna: true,
          siret: true,
          adresseLigne1: true,
          adresseLigne2: true,
          codePostal: true,
          ville: true,
          pays: true,
          plan: true,
          typeCompte: true,
        },
      },
    },
  });

  if (!cotisation) {
    return NextResponse.json({ error: "Cotisation introuvable." }, { status: 404 });
  }
  if (!cotisation.datePaiement) {
    return NextResponse.json(
      { error: "Aucun reçu : cette cotisation n'est pas encore marquée payée." },
      { status: 400 }
    );
  }
  if (!(await autoriserGenerationPdf({ id: session.tenantId, ...cotisation.tenant }))) {
    return NextResponse.json({ error: MESSAGE_LIMITE_PDF }, { status: 403 });
  }

  const html = renderRecuHtml({
    titre: "Reçu de cotisation",
    numero: `COT-${cotisation.id.slice(0, 8).toUpperCase()}`,
    emetteur: cotisation.tenant,
    nomBeneficiaire: `${cotisation.membre.civilite ? `${cotisation.membre.civilite} ` : ""}${cotisation.membre.prenom} ${cotisation.membre.nom}`,
    montant: Number(cotisation.montant),
    date: cotisation.datePaiement,
    objet: `Cotisation - période ${cotisation.periode}`,
    moyenPaiement:
      cotisation.moyenPaiement && estMoyenPaiementValide(cotisation.moyenPaiement)
        ? LABELS_MOYEN_PAIEMENT[cotisation.moyenPaiement]
        : cotisation.moyenPaiement,
  });
  const pdf = await genererPdf(html);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${telecharger ? "attachment" : "inline"}; filename="recu-cotisation-${cotisation.periode}.pdf"`,
    },
  });
}
