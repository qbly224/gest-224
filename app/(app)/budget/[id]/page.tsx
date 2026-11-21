import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateLigneBudget, supprimerLigneBudget } from "@/lib/actions/budget";
import { LigneBudgetForm } from "@/components/budget/ligne-budget-form";
import { BoutonSupprimer } from "@/components/forms/bouton-supprimer";

export default async function ModifierLigneBudgetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const t = await getTranslations("app.budget");

  const ligne = await prisma.ligneBudget.findFirst({
    where: { id, tenantId: session.tenantId },
  });

  if (!ligne) {
    notFound();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">{t("modifierTitre")}</h1>
        <form action={supprimerLigneBudget.bind(null, ligne.id)}>
          <BoutonSupprimer confirmMessage={t("confirmSuppression")} />
        </form>
      </div>
      <div className="mt-6">
        <LigneBudgetForm
          ligne={{ ...ligne, montantPrevu: ligne.montantPrevu.toString() }}
          action={updateLigneBudget.bind(null, ligne.id)}
        />
      </div>
    </div>
  );
}
