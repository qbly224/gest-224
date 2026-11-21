import { getTranslations } from "next-intl/server";
import { createReunion } from "@/lib/actions/reunions";
import { ReunionForm } from "@/components/reunions/reunion-form";

export default async function NouvelleReunionPage() {
  const t = await getTranslations("app.reunions");
  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">{t("nouveauTitre")}</h1>
      <ReunionForm action={createReunion} />
    </div>
  );
}
