import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { renderRecuHtml } from "@/lib/pdf/recu-template";
import { genererPdf } from "@/lib/pdf/generate";
import { autoriserGenerationPdf, MESSAGE_LIMITE_PDF } from "@/lib/pdf/limite";

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

  const don = await prisma.don.findFirst({
    where: { id, tenantId: session.tenantId },
    include: {
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

  if (!don) {
    return NextResponse.json({ error: "Don introuvable." }, { status: 404 });
  }
  if (!(await autoriserGenerationPdf({ id: session.tenantId, ...don.tenant }))) {
    return NextResponse.json({ error: MESSAGE_LIMITE_PDF }, { status: 403 });
  }

  const html = renderRecuHtml({
    titre: don.type === "subvention" ? "Reçu de subvention" : "Reçu de don",
    numero: `DON-${don.id.slice(0, 8).toUpperCase()}`,
    emetteur: don.tenant,
    nomBeneficiaire: don.donateur,
    montant: Number(don.montant),
    date: don.date,
    objet: don.type === "subvention" ? "Subvention" : "Don",
  });
  const pdf = await genererPdf(html);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${telecharger ? "attachment" : "inline"}; filename="recu-don-${don.id.slice(0, 8)}.pdf"`,
    },
  });
}
