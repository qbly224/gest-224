import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createFactureRecurrente } from "@/lib/actions/factures-recurrentes";
import { listerClientsOptions } from "@/lib/documents/options";
import { FactureRecurrenteForm } from "@/components/factures-recurrentes/facture-recurrente-form";

export default async function NouvelleFactureRecurrentePage() {
  const session = await requireSession();
  const t = await getTranslations("app.facturesRecurrentes");
  const [tenant, clients] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId }, select: { regimeTva: true } }),
    listerClientsOptions(session.tenantId),
  ]);

  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">{t("nouveauTitre")}</h1>
      {clients.length === 0 ? (
        <p className="mt-4 font-sans text-sm text-encre/70">{t("pasDeClient")}</p>
      ) : (
        <FactureRecurrenteForm
          clients={clients}
          regimeTva={tenant.regimeTva}
          action={createFactureRecurrente}
        />
      )}
    </div>
  );
}
