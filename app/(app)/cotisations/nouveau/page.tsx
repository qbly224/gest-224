import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCotisation } from "@/lib/actions/cotisations";
import { CotisationForm } from "@/components/cotisations/cotisation-form";

export default async function NouvelleCotisationPage({
  searchParams,
}: {
  searchParams: Promise<{ membreId?: string }>;
}) {
  const { membreId } = await searchParams;
  const session = await requireSession();
  const t = await getTranslations("app.cotisations");

  const membres = await prisma.membre.findMany({
    where: { tenantId: session.tenantId, actif: true },
    select: { id: true, prenom: true, nom: true },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });

  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">{t("nouveauTitre")}</h1>
      <CotisationForm membres={membres} membreIdInitial={membreId} action={createCotisation} />
    </div>
  );
}
