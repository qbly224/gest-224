import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/actions/clients";
import { ClientForm } from "@/components/clients/client-form";

export default async function NouveauClientPage() {
  const t = await getTranslations("app.clients");
  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">{t("nouveauTitre")}</h1>
      <ClientForm action={createClient} />
    </div>
  );
}
