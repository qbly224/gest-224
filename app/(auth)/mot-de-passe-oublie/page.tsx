import { getTranslations } from "next-intl/server";
import { DemandeResetForm } from "@/components/auth/demande-reset-form";

export default async function MotDePasseOubliePage() {
  const t = await getTranslations("auth.motDePasseOublie");

  return (
    <>
      <h1 className="font-titre text-3xl text-encre">{t("titre")}</h1>
      <p className="mt-2 font-sans text-sm text-encre/70">{t("sousTitre")}</p>
      <DemandeResetForm />
    </>
  );
}
