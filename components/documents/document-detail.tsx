import type { DocumentLigne, StatutDocument } from "@prisma/client";
import { STATUT_LABELS } from "@/lib/documents/statut-labels";
import { nomAffichageClientSnapshot } from "@/lib/documents/snapshot";
import type { ClientSnapshot, EmetteurSnapshot } from "@/lib/documents/snapshot";
import { calculerTotaux } from "@/lib/documents/calc";

function formatEuros(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

export function DocumentDetail({
  titre,
  document,
  masquerPrix = false,
  montantLabel = "Total TTC",
  afficherPaiement = false,
  reference,
  aval,
  actions,
}: {
  titre: string;
  document: {
    numero: string;
    statut: StatutDocument;
    dateEmission: Date;
    dateEcheance: Date | null;
    tauxPenaliteRetard: unknown;
    conditionsPaiement: string | null;
    clientSnapshot: unknown;
    emetteurSnapshot: unknown;
    lignes: DocumentLigne[];
  };
  masquerPrix?: boolean;
  montantLabel?: string;
  afficherPaiement?: boolean;
  reference?: React.ReactNode;
  aval?: React.ReactNode;
  actions: React.ReactNode;
}) {
  const client = document.clientSnapshot as unknown as ClientSnapshot;
  const emetteur = document.emetteurSnapshot as unknown as EmetteurSnapshot;
  const afficherTva = emetteur.regimeTva === "normal";
  const totaux = calculerTotaux(
    document.lignes.map((l) => ({
      quantite: Number(l.quantite),
      prixUnitaireHt: Number(l.prixUnitaireHt),
      tauxTva: l.tauxTva !== null ? Number(l.tauxTva) : null,
      remisePourcentage: Number(l.remisePourcentage),
    }))
  );

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {emetteur.logoDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={emetteur.logoDataUrl}
              alt=""
              className="mb-3 h-12 w-auto max-w-[160px] object-contain"
            />
          )}
          <p className="font-mono text-xs uppercase tracking-wide text-encre/50">{titre}</p>
          <h1 className="font-mono text-2xl text-encre">{document.numero}</h1>
          <p className="mt-1 font-sans text-sm text-encre/70">
            {STATUT_LABELS[document.statut]} — émis le{" "}
            {new Intl.DateTimeFormat("fr-FR").format(document.dateEmission)}
          </p>
          {reference}
        </div>
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      </div>

      {aval}

      <div className="mt-8 grid grid-cols-1 gap-6 font-sans text-sm sm:grid-cols-2 sm:gap-8">
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

      {afficherPaiement && (
        <div className="mt-4 flex gap-8 font-sans text-sm text-encre/70">
          <p>
            Échéance :{" "}
            <span className="font-mono text-encre">
              {document.dateEcheance
                ? new Intl.DateTimeFormat("fr-FR").format(document.dateEcheance)
                : "—"}
            </span>
          </p>
          <p>
            Pénalités de retard :{" "}
            <span className="font-mono text-encre">
              {document.tauxPenaliteRetard ? String(document.tauxPenaliteRetard) : "10"} % / an
            </span>
          </p>
        </div>
      )}

      <div className="mt-8 overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse font-sans text-sm">
        <thead>
          <tr className="border-b border-encre/20 text-left text-encre/60">
            <th className="py-2 font-medium">Désignation</th>
            <th className="py-2 text-right font-medium">Quantité</th>
            {!masquerPrix && (
              <>
                <th className="py-2 text-right font-medium">PU HT</th>
                {afficherTva && <th className="py-2 text-right font-medium">TVA</th>}
                <th className="py-2 text-right font-medium">Total HT</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {document.lignes.map((l) => (
            <tr key={l.id} className="border-b border-encre/10">
              <td className="py-3 text-encre">{l.designation}</td>
              <td className="py-3 text-right font-mono text-encre/70">
                {l.quantite.toString()} {l.uniteMesure}
              </td>
              {!masquerPrix && (
                <>
                  <td className="py-3 text-right font-mono text-encre/70">
                    {formatEuros(Number(l.prixUnitaireHt))}
                  </td>
                  {afficherTva && (
                    <td className="py-3 text-right font-mono text-encre/70">
                      {l.tauxTva !== null ? `${l.tauxTva.toString()} %` : "—"}
                    </td>
                  )}
                  <td className="py-3 text-right font-mono text-encre">
                    {formatEuros(Number(l.montantHt))}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {!masquerPrix && (
        <div className="ml-auto mt-6 w-full max-w-xs space-y-1 font-sans text-sm">
          <div className="flex justify-between text-encre/80">
            <span>Total HT</span>
            <span className="font-mono">{formatEuros(totaux.montantHt)}</span>
          </div>
          {afficherTva ? (
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
            <span>{montantLabel}</span>
            <span className="font-mono">{formatEuros(totaux.montantTtc)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
