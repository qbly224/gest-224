import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateChantier } from "@/lib/actions/chantiers";
import { listerClientsOptions } from "@/lib/documents/options";
import { ChantierForm } from "@/components/chantiers/chantier-form";

export default async function ModifierChantierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const t = await getTranslations("app.chantiers");

  const [chantier, clients] = await Promise.all([
    prisma.chantier.findFirst({ where: { id, tenantId: session.tenantId } }),
    listerClientsOptions(session.tenantId),
  ]);

  if (!chantier) notFound();

  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">{t("modifierTitre")}</h1>
      <ChantierForm
        chantier={{
          ...chantier,
          montant: chantier.montant ? chantier.montant.toString() : null,
          dateDebut: chantier.dateDebut ? chantier.dateDebut.toISOString().slice(0, 10) : null,
          dateEcheance: chantier.dateEcheance
            ? chantier.dateEcheance.toISOString().slice(0, 10)
            : null,
        }}
        clients={clients}
        action={updateChantier.bind(null, chantier.id)}
      />
    </div>
  );
}
