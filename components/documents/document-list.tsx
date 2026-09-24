import Link from "next/link";
import { STATUT_LABELS } from "@/lib/documents/statut-labels";
import { lienTri, flecheTri } from "@/lib/documents/tri";
import type { StatutDocument } from "@prisma/client";

export type DocumentListRow = {
  id: string;
  numero: string;
  statut: StatutDocument;
  dateEmission: Date;
  clientLabel: string;
  montantTtc: string;
};

export function DocumentList({
  rows,
  basePath,
  emptyLabel,
  showMontant = true,
  montantLabel = "Total TTC",
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
              Numéro{flecheTri("numero", tri, ordre)}
            </Link>
          </th>
          <th className={enTeteClass}>
            <Link href={lienTri(params, "client", tri, ordre)}>
              Client{flecheTri("client", tri, ordre)}
            </Link>
          </th>
          <th className={enTeteClass}>
            <Link href={lienTri(params, "date", tri, ordre)}>
              Émis le{flecheTri("date", tri, ordre)}
            </Link>
          </th>
          <th className="py-2 font-medium">Statut</th>
          {showMontant && (
            <th className={enTeteClassDroite}>
              <Link href={lienTri(params, "montant", tri, ordre)}>
                {montantLabel}
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
            <td className="py-3 text-encre/70">
              {new Intl.DateTimeFormat("fr-FR").format(row.dateEmission)}
            </td>
            <td className="py-3">
              <span className="font-mono text-xs text-encre/70">
                {STATUT_LABELS[row.statut]}
              </span>
            </td>
            {showMontant && (
              <td className="py-3 text-right font-mono text-encre">
                {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
                  Number(row.montantTtc)
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}
