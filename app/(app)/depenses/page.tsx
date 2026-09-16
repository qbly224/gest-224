import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supprimerDepense } from "@/lib/actions/comptabilite";

function formatEuros(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

export default async function DepensesPage() {
  const session = await requireSession();
  const depenses = await prisma.depense.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { date: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-titre text-2xl text-encre">Dépenses</h1>
        <Link
          href="/depenses/nouveau"
          className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
        >
          Nouvelle dépense
        </Link>
      </div>

      {depenses.length === 0 ? (
        <p className="mt-8 font-sans text-sm text-encre/60">
          Aucune dépense enregistrée pour l&apos;instant.
        </p>
      ) : (
        <table className="mt-6 w-full border-collapse font-sans text-sm">
          <thead>
            <tr className="border-b border-encre/20 text-left text-encre/60">
              <th className="py-2 font-medium">Date</th>
              <th className="py-2 font-medium">Libellé</th>
              <th className="py-2 font-medium">Catégorie</th>
              <th className="py-2 text-right font-medium">Montant</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {depenses.map((d) => (
              <tr key={d.id} className="border-b border-encre/10">
                <td className="py-3 font-mono text-encre/70">
                  {new Intl.DateTimeFormat("fr-FR").format(d.date)}
                </td>
                <td className="py-3 text-encre">
                  <Link href={`/depenses/${d.id}/modifier`} className="hover:underline">
                    {d.libelle}
                  </Link>
                </td>
                <td className="py-3 text-encre/70">{d.categorie ?? "—"}</td>
                <td className="py-3 text-right font-mono text-encre">
                  {formatEuros(Number(d.montant))}
                </td>
                <td className="py-3 text-right">
                  <form action={supprimerDepense.bind(null, d.id)}>
                    <button
                      type="submit"
                      className="font-sans text-xs text-encre/60 hover:text-encre hover:underline"
                    >
                      Supprimer
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
