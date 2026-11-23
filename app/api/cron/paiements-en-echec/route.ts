import { NextResponse } from "next/server";
import { bloquerAbonnementsEnEchec } from "@/lib/paiement-echec";

export async function GET(request: Request) {
  const secretAttendu = process.env.CRON_SECRET_PAIEMENTS;
  const secretRecu = request.headers.get("x-cron-secret");

  if (!secretAttendu || secretRecu !== secretAttendu) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const resultat = await bloquerAbonnementsEnEchec();
  return NextResponse.json(resultat);
}
