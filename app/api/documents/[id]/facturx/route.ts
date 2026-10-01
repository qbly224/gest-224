import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { renderDocumentHtml } from "@/lib/pdf/template";
import { genererPdf } from "@/lib/pdf/generate";
import { genererCiiXml } from "@/lib/facturx/cii-xml";
import { embarquerXmlDansPdf } from "@/lib/facturx/embarquer";
import type { ClientSnapshot, EmetteurSnapshot } from "@/lib/documents/snapshot";

const TYPES_FACTURABLES = new Set(["facture", "facture_acompte", "facture_avoir"]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;

  const document = await prisma.document.findFirst({
    where: { id, tenantId: session.tenantId },
    include: {
      lignes: { orderBy: { ordre: "asc" } },
      refDocument: { select: { numero: true, type: true } },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
  }
  if (!TYPES_FACTURABLES.has(document.type)) {
    return NextResponse.json(
      { error: "Le format Factur-X ne s'applique qu'aux factures et avoirs." },
      { status: 400 }
    );
  }

  const emetteur = document.emetteurSnapshot as unknown as EmetteurSnapshot;
  const client = document.clientSnapshot as unknown as ClientSnapshot;

  const html = renderDocumentHtml(document);
  const pdf = await genererPdf(html);
  const xml = genererCiiXml(document, emetteur, client);
  const pdfFacturX = await embarquerXmlDansPdf(pdf, xml);

  return new NextResponse(new Uint8Array(pdfFacturX), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${document.numero}-facturx.pdf"`,
    },
  });
}
