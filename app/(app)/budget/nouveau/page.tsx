import { getTranslations } from "next-intl/server";
import { createLigneBudget } from "@/lib/actions/budget";
import { LigneBudgetForm } from "@/components/budget/ligne-budget-form";

export default async function NouvelleLigneBudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ annee?: string; type?: string }>;
}) {
  const { annee, type } = await searchParams;
  const t = await getTranslations("app.budget");

  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">{t("nouveauTitre")}</h1>
      <div className="mt-6">
        <LigneBudgetForm
          anneeInitiale={annee ? Number(annee) : undefined}
          typeInitial={type === "depense" ? "depense" : "recette"}
          action={createLigneBudget}
        />
      </div>
    </div>
  );
}
