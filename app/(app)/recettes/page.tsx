import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TITRES_DOCUMENT } from "@/lib/documents/statut-labels";

function formatEuros(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

export default async function RecettesPage() {
  const session = await requireSession();
  const recettes = await prisma.recette.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { datePaiement: "desc" },
    include: { document: { select: { id: true, type: true, numero: true } } },
  });

  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">Recettes</h1>
      <p className="mt-1 font-sans text-sm text-encre/70">
        Générées automatiquement lorsqu&apos;une facture ou une facture
        d&apos;acompte est marquée payée.
      </p>

      {recettes.length === 0 ? (
        <p className="mt-8 font-sans text-sm text-encre/60">
          Aucune recette pour l&apos;instant.
        </p>
      ) : (
        <table className="mt-6 w-full border-collapse font-sans text-sm">
          <thead>
            <tr className="border-b border-encre/20 text-left text-encre/60">
              <th className="py-2 font-medium">Date de paiement</th>
              <th className="py-2 font-medium">Document</th>
              <th className="py-2 text-right font-medium">Montant</th>
            </tr>
          </thead>
          <tbody>
            {recettes.map((r) => (
              <tr key={r.id} className="border-b border-encre/10">
                <td className="py-3 font-mono text-encre/70">
                  {new Intl.DateTimeFormat("fr-FR").format(r.datePaiement)}
                </td>
                <td className="py-3">
                  <Link
                    href={`${r.document.type === "facture" ? "/factures" : "/factures-acompte"}/${r.document.id}`}
                    className="font-mono text-encre hover:underline"
                  >
                    {r.document.numero}
                  </Link>
                  <span className="ml-2 text-xs text-encre/50">
                    {TITRES_DOCUMENT[r.document.type]}
                  </span>
                </td>
                <td className="py-3 text-right font-mono text-encre">
                  {formatEuros(Number(r.montant))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
