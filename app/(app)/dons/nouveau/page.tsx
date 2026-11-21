import { getTranslations } from "next-intl/server";
import { createDon } from "@/lib/actions/dons";
import { DonForm } from "@/components/dons/don-form";

export default async function NouveauDonPage() {
  const t = await getTranslations("app.dons");
  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">{t("nouveauTitre")}</h1>
      <DonForm action={createDon} />
    </div>
  );
}
