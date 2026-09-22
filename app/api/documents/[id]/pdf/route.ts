import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { renderDocumentHtml } from "@/lib/pdf/template";
import { genererPdf } from "@/lib/pdf/generate";

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

  const html = renderDocumentHtml(document);
  const pdf = await genererPdf(html);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${telecharger ? "attachment" : "inline"}; filename="${document.numero}.pdf"`,
    },
  });
}
