import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateFactureRecurrente } from "@/lib/actions/factures-recurrentes";
import { listerClientsOptions } from "@/lib/documents/options";
import { FactureRecurrenteForm } from "@/components/factures-recurrentes/facture-recurrente-form";

export default async function ModifierFactureRecurrentePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const t = await getTranslations("app.facturesRecurrentes");

  const [tenant, modele, clients] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId }, select: { regimeTva: true } }),
    prisma.factureRecurrente.findFirst({ where: { id, tenantId: session.tenantId } }),
    listerClientsOptions(session.tenantId),
  ]);

  if (!modele) notFound();

  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">{t("modifierTitre")}</h1>
      <FactureRecurrenteForm
        modele={{
          ...modele,
          quantite: modele.quantite.toString(),
          prixUnitaireHt: modele.prixUnitaireHt.toString(),
          tauxTva: modele.tauxTva ? modele.tauxTva.toString() : null,
          prochaineGenerationDate: modele.prochaineGenerationDate.toISOString().slice(0, 10),
        }}
        clients={clients}
        regimeTva={tenant.regimeTva}
        action={updateFactureRecurrente.bind(null, modele.id)}
      />
    </div>
  );
}
