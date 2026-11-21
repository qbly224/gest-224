import { getTranslations } from "next-intl/server";
import { DocumentAssociatifForm } from "@/components/documents-association/document-form";

export default async function NouveauDocumentPage() {
  const t = await getTranslations("app.documents");
  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">{t("nouveauTitre")}</h1>
      <DocumentAssociatifForm />
    </div>
  );
}
