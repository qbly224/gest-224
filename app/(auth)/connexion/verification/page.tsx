import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getPending2faSession } from "@/lib/session";
import { VerificationTotpForm } from "@/components/auth/verification-totp-form";

export default async function VerificationTotpPage() {
  const pending = await getPending2faSession();
  if (!pending) {
    redirect("/connexion");
  }

  const t = await getTranslations("auth.verificationTotp");

  return (
    <>
      <h1 className="font-titre text-3xl text-encre">{t("titre")}</h1>
      <p className="mt-2 font-sans text-sm text-encre/70">{t("sousTitre")}</p>
      <VerificationTotpForm />
    </>
  );
}
