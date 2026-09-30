import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { createChantier } from "@/lib/actions/chantiers";
import { listerClientsOptions } from "@/lib/documents/options";
import { ChantierForm } from "@/components/chantiers/chantier-form";

export default async function NouveauChantierPage() {
  const session = await requireSession();
  const t = await getTranslations("app.chantiers");
  const clients = await listerClientsOptions(session.tenantId);

  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">{t("nouveauTitre")}</h1>
      <ChantierForm clients={clients} action={createChantier} />
    </div>
  );
}
