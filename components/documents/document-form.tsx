"use client";

import { useActionState, useId, useMemo, useState } from "react";
import type { TypeDocument } from "@prisma/client";
import { initialActionState, type ActionState } from "@/lib/actions/types";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { TAUX_TVA_AUTORISES } from "@/lib/validation/article";
import { calculerTotaux } from "@/lib/documents/calc";
import { inputClass, labelClass, selectClass } from "@/lib/ui";

type DocumentFormAction = (
  prevState: ActionState,
  formData: FormData
) => Promise<ActionState>;

export type ClientOption = { id: string; label: string };

export type ArticleOption = {
  id: string;
  designation: string;
  prixUnitaireHt: string;
  tauxTva: string | null;
  uniteMesure: string | null;
};

type LigneState = {
  key: string;
  articleId: string | null;
  designation: string;
  description: string;
  uniteMesure: string;
  quantite: string;
  prixUnitaireHt: string;
  tauxTva: number | null;
  remisePourcentage: string;
};

export type DocumentFormInitialData = {
  clientId: string;
  dateEmission: string; // yyyy-mm-dd
  dateEcheance: string; // yyyy-mm-dd ou ""
  conditionsPaiement: string;
  tauxPenaliteRetard: string;
  notes: string;
  lignes: LigneState[];
};

function nouvelleLigne(regimeTvaNormal: boolean): LigneState {
  return {
    key: crypto.randomUUID(),
    articleId: null,
    designation: "",
    description: "",
    uniteMesure: "",
    quantite: "1",
    prixUnitaireHt: "0",
    tauxTva: regimeTvaNormal ? 20 : null,
    remisePourcentage: "0",
  };
}

function formatEuros(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

export function DocumentForm({
  type,
  clients,
  articles,
  regimeTvaNormal,
  action,
  initial,
}: {
  type: TypeDocument;
  clients: ClientOption[];
  articles: ArticleOption[];
  regimeTvaNormal: boolean;
  action: DocumentFormAction;
  initial?: DocumentFormInitialData;
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  const idPrefix = useId();

  const [clientId, setClientId] = useState(initial?.clientId ?? clients[0]?.id ?? "");
  const [dateEmission, setDateEmission] = useState(
    initial?.dateEmission ?? new Date().toISOString().slice(0, 10)
  );
  const [dateEcheance, setDateEcheance] = useState(initial?.dateEcheance ?? "");
  const [conditionsPaiement, setConditionsPaiement] = useState(
    initial?.conditionsPaiement ?? ""
  );
  const [tauxPenaliteRetard, setTauxPenaliteRetard] = useState(
    initial?.tauxPenaliteRetard ?? "10"
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [lignes, setLignes] = useState<LigneState[]>(
    initial?.lignes && initial.lignes.length > 0
      ? initial.lignes
      : [nouvelleLigne(regimeTvaNormal)]
  );

  // L'avoir rembourse le client : pas d'échéance ni de pénalités de retard.
  const mentionsFacture = type === "facture" || type === "facture_acompte";
  const quantiteLibre = type === "facture_avoir";

  function updateLigne(key: string, patch: Partial<LigneState>) {
    setLignes((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function ajouterLigne() {
    setLignes((prev) => [...prev, nouvelleLigne(regimeTvaNormal)]);
  }

  function supprimerLigne(key: string) {
    setLignes((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  }

  function appliquerArticle(key: string, articleId: string) {
    const article = articles.find((a) => a.id === articleId);
    if (!article) {
      updateLigne(key, { articleId: null });
      return;
    }
    updateLigne(key, {
      articleId: article.id,
      designation: article.designation,
      uniteMesure: article.uniteMesure ?? "",
      prixUnitaireHt: article.prixUnitaireHt,
      tauxTva: regimeTvaNormal ? Number(article.tauxTva ?? "20") : null,
    });
  }

  const lignesJson = useMemo(
    () =>
      JSON.stringify(
        lignes.map((l) => ({
          articleId: l.articleId,
          designation: l.designation,
          description: l.description,
          uniteMesure: l.uniteMesure,
          quantite: Number(l.quantite) || 0,
          prixUnitaireHt: Number(l.prixUnitaireHt) || 0,
          tauxTva: regimeTvaNormal ? l.tauxTva : null,
          remisePourcentage: Number(l.remisePourcentage) || 0,
        }))
      ),
    [lignes, regimeTvaNormal]
  );

  const totaux = useMemo(
    () =>
      calculerTotaux(
        lignes.map((l) => ({
          quantite: Number(l.quantite) || 0,
          prixUnitaireHt: Number(l.prixUnitaireHt) || 0,
          tauxTva: regimeTvaNormal ? l.tauxTva : null,
          remisePourcentage: Number(l.remisePourcentage) || 0,
        }))
      ),
    [lignes, regimeTvaNormal]
  );

  return (
    <form action={formAction} className="mt-6 space-y-6">
      {state.error && (
        <p className="rounded-sm bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
          {state.error}
        </p>
      )}
      <FieldError messages={state.fieldErrors?.lignes} />

      <input type="hidden" name="lignesJson" value={lignesJson} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-clientId`}>
            Client
          </label>
          <select
            id={`${idPrefix}-clientId`}
            name="clientId"
            required
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className={selectClass}
          >
            <option value="" disabled>
              Sélectionner un client
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <FieldError messages={state.fieldErrors?.clientId} />
        </div>

        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-dateEmission`}>
            Date d&apos;émission
          </label>
          <input
            id={`${idPrefix}-dateEmission`}
            name="dateEmission"
            type="date"
            required
            value={dateEmission}
            onChange={(e) => setDateEmission(e.target.value)}
            className={`${inputClass} font-mono`}
          />
        </div>
      </div>

      {mentionsFacture && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor={`${idPrefix}-dateEcheance`}>
              Date d&apos;échéance
            </label>
            <input
              id={`${idPrefix}-dateEcheance`}
              name="dateEcheance"
              type="date"
              value={dateEcheance}
              onChange={(e) => setDateEcheance(e.target.value)}
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor={`${idPrefix}-tauxPenaliteRetard`}>
              Taux de pénalité de retard (% / an)
            </label>
            <input
              id={`${idPrefix}-tauxPenaliteRetard`}
              name="tauxPenaliteRetard"
              type="number"
              step="0.01"
              min="0"
              value={tauxPenaliteRetard}
              onChange={(e) => setTauxPenaliteRetard(e.target.value)}
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>
      )}

      <div>
        <label className={labelClass} htmlFor={`${idPrefix}-conditionsPaiement`}>
          Conditions de paiement
        </label>
        <input
          id={`${idPrefix}-conditionsPaiement`}
          name="conditionsPaiement"
          value={conditionsPaiement}
          onChange={(e) => setConditionsPaiement(e.target.value)}
          placeholder="Ex. Paiement à réception"
          className={inputClass}
        />
      </div>

      <div className="border-t border-encre/10 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="font-titre text-lg text-encre">Lignes</h2>
          <button
            type="button"
            onClick={ajouterLigne}
            className="font-sans text-sm text-encre underline hover:text-encre-light"
          >
            + Ajouter une ligne
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {lignes.map((ligne, index) => (
            <div
              key={ligne.key}
              data-testid="ligne-row"
              className="rounded-sm border border-encre/15 bg-white/40 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-encre/50">
                  Ligne {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => supprimerLigne(ligne.key)}
                  disabled={lignes.length === 1}
                  className="font-sans text-xs text-encre/60 hover:text-encre hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Supprimer
                </button>
              </div>

              {articles.length > 0 && (
                <div className="mt-2">
                  <label className={labelClass}>Depuis le catalogue (optionnel)</label>
                  <select
                    value={ligne.articleId ?? ""}
                    onChange={(e) => appliquerArticle(ligne.key, e.target.value)}
                    className={selectClass}
                  >
                    <option value="">— Ligne libre —</option>
                    {articles.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.designation}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mt-2">
                <label className={labelClass}>Désignation</label>
                <input
                  data-testid="ligne-designation"
                  required
                  value={ligne.designation}
                  onChange={(e) => updateLigne(ligne.key, { designation: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="mt-2">
                <label className={labelClass}>Description (optionnel)</label>
                <input
                  value={ligne.description}
                  onChange={(e) => updateLigne(ligne.key, { description: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div
                className={`mt-2 grid gap-3 ${regimeTvaNormal ? "grid-cols-5" : "grid-cols-4"}`}
              >
                <div>
                  <label className={labelClass}>
                    {quantiteLibre ? "Quantité (négative = à déduire)" : "Quantité"}
                  </label>
                  <input
                    data-testid="ligne-quantite"
                    type="number"
                    step="0.01"
                    min={quantiteLibre ? undefined : "0"}
                    required
                    value={ligne.quantite}
                    onChange={(e) => updateLigne(ligne.key, { quantite: e.target.value })}
                    className={`${inputClass} font-mono`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Unité</label>
                  <input
                    value={ligne.uniteMesure}
                    onChange={(e) => updateLigne(ligne.key, { uniteMesure: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>PU HT (€)</label>
                  <input
                    data-testid="ligne-prix"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={ligne.prixUnitaireHt}
                    onChange={(e) => updateLigne(ligne.key, { prixUnitaireHt: e.target.value })}
                    className={`${inputClass} font-mono`}
                  />
                </div>
                {regimeTvaNormal && (
                  <div>
                    <label className={labelClass}>TVA</label>
                    <select
                      data-testid="ligne-tva"
                      value={ligne.tauxTva ?? ""}
                      onChange={(e) =>
                        updateLigne(ligne.key, { tauxTva: Number(e.target.value) })
                      }
                      className={selectClass}
                    >
                      {TAUX_TVA_AUTORISES.map((t) => (
                        <option key={t} value={t}>
                          {t} %
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className={labelClass}>Remise (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={ligne.remisePourcentage}
                    onChange={(e) =>
                      updateLigne(ligne.key, { remisePourcentage: e.target.value })
                    }
                    className={`${inputClass} font-mono`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ml-auto w-full max-w-xs space-y-1 font-sans text-sm">
        <div className="flex justify-between text-encre/80">
          <span>Total HT</span>
          <span className="font-mono">{formatEuros(totaux.montantHt)}</span>
        </div>
        {regimeTvaNormal ? (
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

      <div>
        <label className={labelClass} htmlFor={`${idPrefix}-notes`}>
          Notes
        </label>
        <textarea
          id={`${idPrefix}-notes`}
          name="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
        />
      </div>

      <SubmitButton>Enregistrer</SubmitButton>
    </form>
  );
}
