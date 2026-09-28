import { getTranslations } from "next-intl/server";
import { ReinitialiserForm } from "@/components/auth/reinitialiser-form";

export default async function ReinitialiserMotDePassePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = await getTranslations("auth.reinitialiser");

  return (
    <>
      <h1 className="font-titre text-3xl text-encre">{t("titre")}</h1>
      <p className="mt-2 font-sans text-sm text-encre/70">{t("sousTitre")}</p>
      <ReinitialiserForm token={token} />
    </>
  );
}
