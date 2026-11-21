import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateCotisation, supprimerCotisation } from "@/lib/actions/cotisations";
import { CotisationForm } from "@/components/cotisations/cotisation-form";
import { BoutonSupprimer } from "@/components/forms/bouton-supprimer";

export default async function ModifierCotisationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const t = await getTranslations("app.cotisations");

  const [cotisation, membres] = await Promise.all([
    prisma.cotisation.findFirst({
      where: { id, tenantId: session.tenantId },
    }),
    prisma.membre.findMany({
      where: { tenantId: session.tenantId, actif: true },
      select: { id: true, prenom: true, nom: true },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    }),
  ]);

  if (!cotisation) {
    notFound();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">{t("modifierTitre")}</h1>
        <form action={supprimerCotisation.bind(null, cotisation.id)}>
          <BoutonSupprimer confirmMessage={t("confirmSuppression")} />
        </form>
      </div>
      <CotisationForm
        cotisation={{ ...cotisation, montant: cotisation.montant.toString() }}
        membres={membres}
        action={updateCotisation.bind(null, cotisation.id)}
      />
    </div>
  );
}
