import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ reinitialise?: string; compteSupprime?: string }>;
}) {
  const { reinitialise, compteSupprime } = await searchParams;
  const t = await getTranslations("auth.connexion");

  return (
    <>
      <h1 className="font-titre text-3xl text-encre">{t("titre")}</h1>
      <p className="mt-2 font-sans text-sm text-encre/70">{t("sousTitre")}</p>
      <LoginForm reinitialise={reinitialise === "1"} compteSupprime={compteSupprime === "1"} />
    </>
  );
}
