import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateReunion, supprimerReunion } from "@/lib/actions/reunions";
import { ReunionForm } from "@/components/reunions/reunion-form";
import { BoutonSupprimer } from "@/components/forms/bouton-supprimer";

export default async function ModifierReunionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const t = await getTranslations("app.reunions");

  const reunion = await prisma.reunion.findFirst({
    where: { id, tenantId: session.tenantId },
  });

  if (!reunion) {
    notFound();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">{t("modifierTitre")}</h1>
        <form action={supprimerReunion.bind(null, reunion.id)}>
          <BoutonSupprimer confirmMessage={t("confirmSuppression")} />
        </form>
      </div>
      <ReunionForm reunion={reunion} action={updateReunion.bind(null, reunion.id)} />
    </div>
  );
}
