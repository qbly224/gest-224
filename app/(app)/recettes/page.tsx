import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatEuros, formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/config";

export default async function RecettesPage() {
  const session = await requireSession();
  const t = await getTranslations("app.recettes");
  const tTypes = await getTranslations("app.typesDocument");
  const tCommun = await getTranslations("commun");
  const locale = (await getLocale()) as Locale;
  const recettes = await prisma.recette.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { datePaiement: "desc" },
    include: { document: { select: { id: true, type: true, numero: true } } },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">{t("titre")}</h1>
        <a
          href="/api/export/recettes"
          className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
        >
          {tCommun("exporterCsv")}
        </a>
      </div>
      <p className="mt-1 font-sans text-sm text-encre/70">{t("description")}</p>

      {recettes.length === 0 ? (
        <p className="mt-8 font-sans text-sm text-encre/60">{t("emptyDefault")}</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse font-sans text-sm">
          <thead>
            <tr className="border-b border-encre/20 text-left text-encre/60">
              <th className="py-2 font-medium">{t("colDate")}</th>
              <th className="py-2 font-medium">{t("colDocument")}</th>
              <th className="py-2 text-right font-medium">{t("colMontant")}</th>
            </tr>
          </thead>
          <tbody>
            {recettes.map((r) => (
              <tr key={r.id} className="border-b border-encre/10">
                <td className="py-3 font-mono text-encre/70">
                  {formatDate(r.datePaiement, locale)}
                </td>
                <td className="py-3">
                  <Link
                    href={`${r.document.type === "facture" ? "/factures" : "/factures-acompte"}/${r.document.id}`}
                    className="font-mono text-encre hover:underline"
                  >
                    {r.document.numero}
                  </Link>
                  <span className="ml-2 text-xs text-encre/50">
                    {tTypes(r.document.type)}
                  </span>
                </td>
                <td className="py-3 text-right font-mono text-encre">
                  {formatEuros(Number(r.montant), locale)}
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
