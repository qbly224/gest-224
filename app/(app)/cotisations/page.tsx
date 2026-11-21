import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { marquerCotisationPayee } from "@/lib/actions/cotisations";
import { formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import type { Prisma } from "@prisma/client";

export default async function CotisationsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { statut } = await searchParams;
  const session = await requireSession();
  const t = await getTranslations("app.cotisations");
  const locale = (await getLocale()) as Locale;

  const where: Prisma.CotisationWhereInput = {
    tenantId: session.tenantId,
    ...(statut === "payees"
      ? { datePaiement: { not: null } }
      : statut === "impayees"
        ? { datePaiement: null }
        : {}),
  };

  const cotisations = await prisma.cotisation.findMany({
    where,
    include: { membre: { select: { prenom: true, nom: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">{t("titre")}</h1>
        <Link
          href="/cotisations/nouveau"
          className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
        >
          {t("nouveauBouton")}
        </Link>
      </div>

      <form className="mt-4 flex flex-wrap items-center gap-2" method="get">
        <select
          name="statut"
          aria-label={t("colStatut")}
          defaultValue={statut ?? ""}
          className="rounded-sm border border-encre/30 bg-ivoire px-3 py-2 font-sans text-sm text-encre focus:border-encre focus:outline-none"
        >
          <option value="">{t("tous")}</option>
          <option value="payees">{t("payees")}</option>
          <option value="impayees">{t("impayees")}</option>
        </select>
        <button
          type="submit"
          className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
        >
          {t("filtrer")}
        </button>
        {statut && (
          <a href="?" className="font-sans text-xs text-encre/75 underline">
            {t("reinitialiser")}
          </a>
        )}
      </form>

      {cotisations.length === 0 ? (
        <p className="mt-8 font-sans text-sm text-encre/75">
          {statut ? t("emptyFiltre") : t("emptyDefault")}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-encre/20 text-left text-encre/75">
                <th className="py-2 font-medium">{t("colMembre")}</th>
                <th className="py-2 font-medium">{t("colPeriode")}</th>
                <th className="py-2 font-medium">{t("colMontant")}</th>
                <th className="py-2 font-medium">{t("colStatut")}</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {cotisations.map((cotisation) => (
                <tr key={cotisation.id} className="border-b border-encre/10">
                  <td className="py-3">
                    <Link
                      href={`/cotisations/${cotisation.id}`}
                      className="text-encre hover:underline"
                    >
                      {cotisation.membre.prenom} {cotisation.membre.nom}
                    </Link>
                  </td>
                  <td className="py-3 text-encre/70">{cotisation.periode}</td>
                  <td className="py-3 font-mono text-encre/70">
                    {Number(cotisation.montant).toFixed(2)} €
                  </td>
                  <td className="py-3">
                    {cotisation.datePaiement ? (
                      <span className="font-mono text-xs text-encre">
                        {t("payeeLe", { date: formatDate(cotisation.datePaiement, locale) })}
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-encre/70">{t("impayee")}</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {cotisation.datePaiement ? (
                      <a
                        href={`/api/cotisations/${cotisation.id}/recu?telecharger=1`}
                        className="font-sans text-xs text-encre/75 hover:text-encre hover:underline"
                      >
                        {t("telechargerRecu")}
                      </a>
                    ) : (
                      <form action={marquerCotisationPayee.bind(null, cotisation.id)}>
                        <button
                          type="submit"
                          className="font-sans text-xs text-encre/75 hover:text-encre hover:underline"
                        >
                          {t("marquerPayee")}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
