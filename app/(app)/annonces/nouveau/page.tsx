import { getTranslations } from "next-intl/server";
import { AnnonceForm } from "@/components/annonces/annonce-form";

export default async function NouvelleAnnoncePage() {
  const t = await getTranslations("app.annonces");
  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">{t("nouveauTitre")}</h1>
      <AnnonceForm />
    </div>
  );
}
