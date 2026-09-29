import { NextResponse } from "next/server";
import { genererFacturesRecurrentesDues } from "@/lib/recurrence/generer";

export async function GET(request: Request) {
  const secretAttendu = process.env.CRON_SECRET;
  const secretRecu = request.headers.get("x-cron-secret");

  if (!secretAttendu || secretRecu !== secretAttendu) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const resultat = await genererFacturesRecurrentesDues();
  return NextResponse.json(resultat);
}
