import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;
  const piece = await prisma.depensePieceJointe.findFirst({
    where: { id, depense: { tenantId: session.tenantId } },
  });
  if (!piece) {
    return NextResponse.json({ error: "Pièce jointe introuvable." }, { status: 404 });
  }

  const telecharger = new URL(request.url).searchParams.get("telecharger") === "1";

  return new NextResponse(new Uint8Array(piece.contenu), {
    headers: {
      "Content-Type": piece.typeMime,
      "Content-Disposition": `${telecharger ? "attachment" : "inline"}; filename="${piece.nomFichier}"`,
    },
  });
}
