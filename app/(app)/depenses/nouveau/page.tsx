import { getTranslations } from "next-intl/server";
import { createDepense } from "@/lib/actions/comptabilite";
import { DepenseForm } from "@/components/comptabilite/depense-form";

export default async function NouvelleDepensePage() {
  const t = await getTranslations("app.depenses");
  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">{t("nouveauTitre")}</h1>
      <DepenseForm action={createDepense} />
    </div>
  );
}
