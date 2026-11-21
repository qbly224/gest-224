import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateMembre } from "@/lib/actions/membres";
import { MembreForm } from "@/components/membres/membre-form";
import { formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/config";

export default async function ModifierMembrePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const t = await getTranslations("app.membres");
  const locale = (await getLocale()) as Locale;

  const membre = await prisma.membre.findFirst({
    where: { id, tenantId: session.tenantId },
    include: {
      cotisations: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!membre) {
    notFound();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">{t("modifierTitre")}</h1>
        <Link
          href={`/cotisations/nouveau?membreId=${membre.id}`}
          className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
        >
          {t("ajouterCotisation")}
        </Link>
      </div>
      <MembreForm membre={membre} action={updateMembre.bind(null, membre.id)} />

      <div className="mt-10 border-t border-encre/10 pt-6">
        <h2 className="font-titre text-lg text-encre">{t("cotisationsTitre")}</h2>
        {membre.cotisations.length === 0 ? (
          <p className="mt-2 font-sans text-sm text-encre/75">{t("cotisationsVide")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-encre/10">
            {membre.cotisations.map((cotisation) => (
              <li key={cotisation.id} className="flex items-center justify-between gap-3 py-2">
                <Link
                  href={`/cotisations/${cotisation.id}`}
                  className="font-sans text-sm text-encre hover:underline"
                >
                  {cotisation.periode} - {Number(cotisation.montant).toFixed(2)} €
                </Link>
                <span className="font-mono text-xs text-encre/70">
                  {cotisation.datePaiement
                    ? t("payeeLe", { date: formatDate(cotisation.datePaiement, locale) })
                    : t("impayee")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
