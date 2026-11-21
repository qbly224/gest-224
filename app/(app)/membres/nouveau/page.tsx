import { getTranslations } from "next-intl/server";
import { createMembre } from "@/lib/actions/membres";
import { MembreForm } from "@/components/membres/membre-form";

export default async function NouveauMembrePage() {
  const t = await getTranslations("app.membres");
  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">{t("nouveauTitre")}</h1>
      <MembreForm action={createMembre} />
    </div>
  );
}
