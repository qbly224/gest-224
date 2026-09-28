import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { lienTri, flecheTri } from "@/lib/documents/tri";
import { formatDate, formatEuros } from "@/lib/format";
import { obtenirLocale } from "@/i18n/request";
import type { StatutDocument } from "@prisma/client";

export type DocumentListRow = {
  id: string;
  numero: string;
  statut: StatutDocument;
  dateEmission: Date;
  clientLabel: string;
  montantTtc: string;
};

export async function DocumentList({
  rows,
  basePath,
  emptyLabel,
  showMontant = true,
  montantLabel,
  q,
  statut,
  depuis,
  jusqua,
  tri,
  ordre,
}: {
  rows: DocumentListRow[];
  basePath: string;
  emptyLabel: string;
  showMontant?: boolean;
  montantLabel?: string;
  q?: string;
  statut?: string;
  depuis?: string;
  jusqua?: string;
  tri?: string;
  ordre?: string;
}) {
  const locale = await obtenirLocale();
  const t = await getTranslations("app.documentList");
  const tStatuts = await getTranslations("app.statuts");
  const libelleMontant = montantLabel ?? t("totalTtc");

  if (rows.length === 0) {
    return <p className="mt-8 font-sans text-sm text-encre/60">{emptyLabel}</p>;
  }

  const params = { q, statut, depuis, jusqua };
  const enTeteClass = "py-2 font-medium hover:text-encre cursor-pointer select-none";
  const enTeteClassDroite = "py-2 text-right font-medium hover:text-encre cursor-pointer select-none";

  return (
    <div className="mt-6 overflow-x-auto">
    <table className="w-full min-w-[560px] border-collapse font-sans text-sm">
      <thead>
        <tr className="border-b border-encre/20 text-left text-encre/60">
          <th className={enTeteClass}>
            <Link href={lienTri(params, "numero", tri, ordre)}>
              {t("numero")}{flecheTri("numero", tri, ordre)}
            </Link>
          </th>
          <th className={enTeteClass}>
            <Link href={lienTri(params, "client", tri, ordre)}>
              {t("client")}{flecheTri("client", tri, ordre)}
            </Link>
          </th>
          <th className={enTeteClass}>
            <Link href={lienTri(params, "date", tri, ordre)}>
              {t("emisLe")}{flecheTri("date", tri, ordre)}
            </Link>
          </th>
          <th className="py-2 font-medium">{t("statut")}</th>
          {showMontant && (
            <th className={enTeteClassDroite}>
              <Link href={lienTri(params, "montant", tri, ordre)}>
                {libelleMontant}
                {flecheTri("montant", tri, ordre)}
              </Link>
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-encre/10">
            <td className="py-3">
              <Link href={`${basePath}/${row.id}`} className="font-mono text-encre hover:underline">
                {row.numero}
              </Link>
            </td>
            <td className="py-3 text-encre/80">{row.clientLabel}</td>
            <td className="py-3 text-encre/70">{formatDate(row.dateEmission, locale)}</td>
            <td className="py-3">
              <span className="font-mono text-xs text-encre/70">
                {tStatuts(row.statut)}
              </span>
            </td>
            {showMontant && (
              <td className="py-3 text-right font-mono text-encre">
                {formatEuros(Number(row.montantTtc), locale)}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}
