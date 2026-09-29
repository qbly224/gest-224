import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CHEMINS_AUTORISES = new Set([
  "/",
  "/a-propos",
  "/tarifs",
  "/cgu",
  "/cgv",
  "/confidentialite",
  "/mentions-legales",
]);

export async function POST(request: Request) {
  try {
    const { path, referrerHost } = await request.json();
    if (typeof path !== "string" || !CHEMINS_AUTORISES.has(path)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await prisma.pageView.create({
      data: {
        path,
        referrerHost: typeof referrerHost === "string" ? referrerHost.slice(0, 200) : null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    // La mesure d'audience ne doit jamais faire échouer autre chose : une
    // erreur ici est journalisée côté infra mais ne remonte pas.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
