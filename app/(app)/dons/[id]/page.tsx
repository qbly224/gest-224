import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateDon, supprimerDon } from "@/lib/actions/dons";
import { DonForm } from "@/components/dons/don-form";
import { BoutonSupprimer } from "@/components/forms/bouton-supprimer";

export default async function ModifierDonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const t = await getTranslations("app.dons");

  const don = await prisma.don.findFirst({
    where: { id, tenantId: session.tenantId },
  });

  if (!don) {
    notFound();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">{t("modifierTitre")}</h1>
        <form action={supprimerDon.bind(null, don.id)}>
          <BoutonSupprimer confirmMessage={t("confirmSuppression")} />
        </form>
      </div>
      <DonForm
        don={{ ...don, montant: don.montant.toString() }}
        action={updateDon.bind(null, don.id)}
      />
    </div>
  );
}
