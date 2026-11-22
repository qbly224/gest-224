import { getTranslations } from "next-intl/server";
import { SignUpForm } from "@/components/auth/signup-form";
import { estPlanValide } from "@/lib/plans";

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; type?: string }>;
}) {
  const { plan, type } = await searchParams;
  const planInitial = plan && estPlanValide(plan) ? plan : "gratuit";
  const typeCompteInitial = type === "association" ? "association" : "entreprise";
  const t = await getTranslations("auth.inscription");

  return (
    <>
      <h1 className="font-titre text-3xl text-encre">{t("titre")}</h1>
      <p className="mt-2 font-sans text-sm text-encre/70">{t("sousTitre")}</p>
      <SignUpForm planInitial={planInitial} typeCompteInitial={typeCompteInitial} />
    </>
  );
}
