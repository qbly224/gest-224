import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supprimerDepense } from "@/lib/actions/comptabilite";
import { BoutonSupprimer } from "@/components/forms/bouton-supprimer";
import { formatEuros, formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/config";

export default async function DepensesPage() {
  const session = await requireSession();
  const t = await getTranslations("app.depenses");
  const tCommun = await getTranslations("commun");
  const locale = (await getLocale()) as Locale;
  const depenses = await prisma.depense.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { date: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">{t("titre")}</h1>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/depenses"
            className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
          >
            {tCommun("exporterCsv")}
          </a>
          <Link
            href="/depenses/nouveau"
            className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
          >
            {t("nouveauBouton")}
          </Link>
        </div>
      </div>

      {depenses.length === 0 ? (
        <p className="mt-8 font-sans text-sm text-encre/60">{t("emptyDefault")}</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse font-sans text-sm">
          <thead>
            <tr className="border-b border-encre/20 text-left text-encre/60">
              <th className="py-2 font-medium">{t("colDate")}</th>
              <th className="py-2 font-medium">{t("colLibelle")}</th>
              <th className="py-2 font-medium">{t("colCategorie")}</th>
              <th className="py-2 text-right font-medium">{t("colMontant")}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {depenses.map((d) => (
              <tr key={d.id} className="border-b border-encre/10">
                <td className="py-3 font-mono text-encre/70">{formatDate(d.date, locale)}</td>
                <td className="py-3 text-encre">
                  <Link href={`/depenses/${d.id}/modifier`} className="hover:underline">
                    {d.libelle}
                  </Link>
                </td>
                <td className="py-3 text-encre/70">{d.categorie ?? "—"}</td>
                <td className="py-3 text-right font-mono text-encre">
                  {formatEuros(Number(d.montant), locale)}
                </td>
                <td className="py-3 text-right">
                  <form action={supprimerDepense.bind(null, d.id)}>
                    <BoutonSupprimer
                      confirmMessage={t("confirmSuppression", { libelle: d.libelle })}
                    />
                  </form>
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
