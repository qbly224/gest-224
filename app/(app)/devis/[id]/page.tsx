import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  envoyerDevis,
  accepterDevis,
  refuserDevis,
  convertirDevisEnFacture,
} from "@/lib/actions/documents";
import { STATUT_LABELS } from "@/lib/documents/statut-labels";
import { nomAffichageClientSnapshot } from "@/lib/documents/snapshot";
import type { ClientSnapshot, EmetteurSnapshot } from "@/lib/documents/snapshot";
import { calculerTotaux } from "@/lib/documents/calc";

function formatEuros(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

export default async function DevisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const devis = await prisma.document.findFirst({
    where: { id, tenantId: session.tenantId, type: "devis" },
    include: {
      lignes: { orderBy: { ordre: "asc" } },
      documentsAval: { where: { type: "facture" }, select: { id: true, numero: true } },
    },
  });
  if (!devis) notFound();

  const client = devis.clientSnapshot as unknown as ClientSnapshot;
  const emetteur = devis.emetteurSnapshot as unknown as EmetteurSnapshot;
  const totaux = calculerTotaux(
    devis.lignes.map((l) => ({
      quantite: Number(l.quantite),
      prixUnitaireHt: Number(l.prixUnitaireHt),
      tauxTva: l.tauxTva !== null ? Number(l.tauxTva) : null,
      remisePourcentage: Number(l.remisePourcentage),
    }))
  );

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-encre/50">Devis</p>
          <h1 className="font-mono text-2xl text-encre">{devis.numero}</h1>
          <p className="mt-1 font-sans text-sm text-encre/70">
            {STATUT_LABELS[devis.statut]} — émis le{" "}
            {new Intl.DateTimeFormat("fr-FR").format(devis.dateEmission)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`/api/documents/${devis.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
          >
            Voir le PDF
          </a>
          {devis.statut === "brouillon" && (
            <>
              <Link
                href={`/devis/${devis.id}/modifier`}
                className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
              >
                Modifier
              </Link>
              <form action={envoyerDevis.bind(null, devis.id)}>
                <button
                  type="submit"
                  className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
                >
                  Envoyer
                </button>
              </form>
            </>
          )}
          {devis.statut === "envoye" && (
            <>
              <form action={refuserDevis.bind(null, devis.id)}>
                <button
                  type="submit"
                  className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
                >
                  Marquer refusé
                </button>
              </form>
              <form action={accepterDevis.bind(null, devis.id)}>
                <button
                  type="submit"
                  className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
                >
                  Marquer accepté
                </button>
              </form>
            </>
          )}
          {devis.statut === "accepte" && (
            <form action={convertirDevisEnFacture.bind(null, devis.id)}>
              <button
                type="submit"
                className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
              >
                Convertir en facture
              </button>
            </form>
          )}
        </div>
      </div>

      {devis.documentsAval.length > 0 && (
        <p className="mt-4 font-sans text-sm text-encre/70">
          Converti en facture :{" "}
          {devis.documentsAval.map((f) => (
            <Link key={f.id} href={`/factures/${f.id}`} className="font-mono underline">
              {f.numero}
            </Link>
          ))}
        </p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-8 font-sans text-sm">
        <div>
          <h2 className="text-xs uppercase tracking-wide text-encre/50">Émetteur</h2>
          <p className="mt-1 font-medium text-encre">{emetteur.raisonSociale}</p>
          <p className="text-encre/70">
            {emetteur.adresseLigne1}, {emetteur.codePostal} {emetteur.ville}
          </p>
        </div>
        <div>
          <h2 className="text-xs uppercase tracking-wide text-encre/50">Client</h2>
          <p className="mt-1 font-medium text-encre">{nomAffichageClientSnapshot(client)}</p>
          <p className="text-encre/70">
            {client.adresseLigne1}, {client.codePostal} {client.ville}
          </p>
        </div>
      </div>

      <table className="mt-8 w-full border-collapse font-sans text-sm">
        <thead>
          <tr className="border-b border-encre/20 text-left text-encre/60">
            <th className="py-2 font-medium">Désignation</th>
            <th className="py-2 text-right font-medium">Quantité</th>
            <th className="py-2 text-right font-medium">PU HT</th>
            {emetteur.regimeTva === "normal" && (
              <th className="py-2 text-right font-medium">TVA</th>
            )}
            <th className="py-2 text-right font-medium">Total HT</th>
          </tr>
        </thead>
        <tbody>
          {devis.lignes.map((l) => (
            <tr key={l.id} className="border-b border-encre/10">
              <td className="py-3 text-encre">{l.designation}</td>
              <td className="py-3 text-right font-mono text-encre/70">
                {l.quantite.toString()} {l.uniteMesure}
              </td>
              <td className="py-3 text-right font-mono text-encre/70">
                {formatEuros(Number(l.prixUnitaireHt))}
              </td>
              {emetteur.regimeTva === "normal" && (
                <td className="py-3 text-right font-mono text-encre/70">
                  {l.tauxTva !== null ? `${l.tauxTva.toString()} %` : "—"}
                </td>
              )}
              <td className="py-3 text-right font-mono text-encre">
                {formatEuros(Number(l.montantHt))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto mt-6 w-full max-w-xs space-y-1 font-sans text-sm">
        <div className="flex justify-between text-encre/80">
          <span>Total HT</span>
          <span className="font-mono">{formatEuros(totaux.montantHt)}</span>
        </div>
        {emetteur.regimeTva === "normal" ? (
          totaux.tvaParTaux.map((t) => (
            <div key={t.taux} className="flex justify-between text-encre/80">
              <span>TVA {t.taux} %</span>
              <span className="font-mono">{formatEuros(t.montantTva)}</span>
            </div>
          ))
        ) : (
          <p className="text-xs italic text-encre/60">
            TVA non applicable, art. 293 B du CGI
          </p>
        )}
        <div className="flex justify-between border-t border-encre/20 pt-1 text-base font-medium text-encre">
          <span>Total TTC</span>
          <span className="font-mono">{formatEuros(totaux.montantTtc)}</span>
        </div>
      </div>
    </div>
  );
}
