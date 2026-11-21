import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatEuros, formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/config";

export default async function DonsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const session = await requireSession();
  const t = await getTranslations("app.dons");
  const locale = (await getLocale()) as Locale;

  const dons = await prisma.don.findMany({
    where: {
      tenantId: session.tenantId,
      ...(type === "don" || type === "subvention" ? { type } : {}),
    },
    orderBy: { date: "desc" },
  });

  const total = dons.reduce((sum, d) => sum + Number(d.montant), 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">{t("titre")}</h1>
        <Link
          href="/dons/nouveau"
          className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
        >
          {t("nouveauBouton")}
        </Link>
      </div>

      <form className="mt-4 flex flex-wrap items-center gap-2" method="get">
        <select
          name="type"
          aria-label={t("type")}
          defaultValue={type ?? ""}
          className="rounded-sm border border-encre/30 bg-ivoire px-3 py-2 font-sans text-sm text-encre focus:border-encre focus:outline-none"
        >
          <option value="">{t("tous")}</option>
          <option value="don">{t("typeDon")}</option>
          <option value="subvention">{t("typeSubvention")}</option>
        </select>
        <button
          type="submit"
          className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
        >
          {t("filtrer")}
        </button>
        {type && (
          <a href="?" className="font-sans text-xs text-encre/75 underline">
            {t("reinitialiser")}
          </a>
        )}
      </form>

      {dons.length === 0 ? (
        <p className="mt-8 font-sans text-sm text-encre/75">
          {type ? t("emptyFiltre") : t("emptyDefault")}
        </p>
      ) : (
        <>
          <p className="mt-4 font-sans text-sm text-encre/80">
            {t("totalLabel", { total: formatEuros(total, locale) })}
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[540px] border-collapse font-sans text-sm">
              <thead>
                <tr className="border-b border-encre/20 text-left text-encre/75">
                  <th className="py-2 font-medium">{t("colDate")}</th>
                  <th className="py-2 font-medium">{t("colDonateur")}</th>
                  <th className="py-2 font-medium">{t("colType")}</th>
                  <th className="py-2 font-medium">{t("colMontant")}</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {dons.map((don) => (
                  <tr key={don.id} className="border-b border-encre/10">
                    <td className="py-3 font-mono text-xs text-encre/70">
                      {formatDate(don.date, locale)}
                    </td>
                    <td className="py-3">
                      <Link href={`/dons/${don.id}`} className="text-encre hover:underline">
                        {don.donateur}
                      </Link>
                    </td>
                    <td className="py-3 text-encre/70">
                      {don.type === "don" ? t("typeDon") : t("typeSubvention")}
                    </td>
                    <td className="py-3 font-mono text-encre/70">
                      {formatEuros(Number(don.montant), locale)}
                    </td>
                    <td className="py-3 text-right">
                      <a
                        href={`/api/dons/${don.id}/recu?telecharger=1`}
                        className="font-sans text-xs text-encre/75 hover:text-encre hover:underline"
                      >
                        {t("telechargerRecu")}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
