import { NextResponse } from "next/server";
import { traiterFileEmails } from "@/lib/jobs/email";

export async function GET(request: Request) {
  const secretAttendu = process.env.CRON_SECRET_EMAILS;
  const secretRecu = request.headers.get("x-cron-secret");

  if (!secretAttendu || secretRecu !== secretAttendu) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const resultat = await traiterFileEmails();
  return NextResponse.json(resultat);
}
