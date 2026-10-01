"use client";

import { useActionState, useId, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { TypeDocument } from "@prisma/client";
import { initialActionState, type ActionState } from "@/lib/actions/types";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { TAUX_TVA_AUTORISES } from "@/lib/validation/article";
import { calculerTotaux } from "@/lib/documents/calc";
import { formatEuros as formatEurosLocale } from "@/lib/format";
import type { Locale } from "@/i18n/config";
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
  const t = useTranslations("app.documentForm");
  const locale = useLocale() as Locale;
  const formatEuros = (n: number) => formatEurosLocale(n, locale);
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-clientId`}>
            {t("client")}
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
              {t("selectionnerClient")}
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
            {t("dateEmission")}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor={`${idPrefix}-dateEcheance`}>
              {t("dateEcheance")}
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
              {t("tauxPenalite")}
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
          {t("conditionsPaiement")}
        </label>
        <input
          id={`${idPrefix}-conditionsPaiement`}
          name="conditionsPaiement"
          value={conditionsPaiement}
          onChange={(e) => setConditionsPaiement(e.target.value)}
          placeholder={t("conditionsPaiementPlaceholder")}
          className={inputClass}
        />
      </div>

      <div className="border-t border-encre/10 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="font-titre text-lg text-encre">{t("lignes")}</h2>
          <button
            type="button"
            onClick={ajouterLigne}
            className="font-sans text-sm text-encre underline hover:text-encre-light"
          >
            {t("ajouterLigne")}
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
                <span className="font-mono text-xs text-encre/70">
                  {t("ligneNumero", { n: index + 1 })}
                </span>
                <button
                  type="button"
                  onClick={() => supprimerLigne(ligne.key)}
                  disabled={lignes.length === 1}
                  className="font-sans text-xs text-encre/75 hover:text-encre hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("supprimer")}
                </button>
              </div>

              {articles.length > 0 && (
                <div className="mt-2">
                  <label className={labelClass} htmlFor={`${idPrefix}-${ligne.key}-catalogue`}>
                    {t("depuisCatalogue")}
                  </label>
                  <select
                    id={`${idPrefix}-${ligne.key}-catalogue`}
                    value={ligne.articleId ?? ""}
                    onChange={(e) => appliquerArticle(ligne.key, e.target.value)}
                    className={selectClass}
                  >
                    <option value="">{t("ligneLibre")}</option>
                    {articles.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.designation}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mt-2">
                <label className={labelClass} htmlFor={`${idPrefix}-${ligne.key}-designation`}>
                  {t("designation")}
                </label>
                <input
                  id={`${idPrefix}-${ligne.key}-designation`}
                  data-testid="ligne-designation"
                  required
                  value={ligne.designation}
                  onChange={(e) => updateLigne(ligne.key, { designation: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="mt-2">
                <label className={labelClass} htmlFor={`${idPrefix}-${ligne.key}-description`}>
                  {t("description")}
                </label>
                <input
                  id={`${idPrefix}-${ligne.key}-description`}
                  value={ligne.description}
                  onChange={(e) => updateLigne(ligne.key, { description: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div
                className={`mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 ${regimeTvaNormal ? "md:grid-cols-5" : "md:grid-cols-4"}`}
              >
                <div>
                  <label className={labelClass} htmlFor={`${idPrefix}-${ligne.key}-quantite`}>
                    {quantiteLibre ? t("quantiteNegative") : t("quantite")}
                  </label>
                  <input
                    id={`${idPrefix}-${ligne.key}-quantite`}
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
                  <label className={labelClass} htmlFor={`${idPrefix}-${ligne.key}-unite`}>
                    {t("unite")}
                  </label>
                  <input
                    id={`${idPrefix}-${ligne.key}-unite`}
                    value={ligne.uniteMesure}
                    onChange={(e) => updateLigne(ligne.key, { uniteMesure: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor={`${idPrefix}-${ligne.key}-prix`}>
                    {t("puHt")}
                  </label>
                  <input
                    id={`${idPrefix}-${ligne.key}-prix`}
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
                    <label className={labelClass} htmlFor={`${idPrefix}-${ligne.key}-tva`}>
                      {t("tva")}
                    </label>
                    <select
                      id={`${idPrefix}-${ligne.key}-tva`}
                      data-testid="ligne-tva"
                      value={ligne.tauxTva ?? ""}
                      onChange={(e) =>
                        updateLigne(ligne.key, { tauxTva: Number(e.target.value) })
                      }
                      className={selectClass}
                    >
                      {TAUX_TVA_AUTORISES.map((tx) => (
                        <option key={tx} value={tx}>
                          {tx} %
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className={labelClass} htmlFor={`${idPrefix}-${ligne.key}-remise`}>
                    {t("remise")}
                  </label>
                  <input
                    id={`${idPrefix}-${ligne.key}-remise`}
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
          <span>{t("totalHt")}</span>
          <span className="font-mono">{formatEuros(totaux.montantHt)}</span>
        </div>
        {regimeTvaNormal ? (
          totaux.tvaParTaux.map((tx) => (
            <div key={tx.taux} className="flex justify-between text-encre/80">
              <span>{t("tva")} {tx.taux} %</span>
              <span className="font-mono">{formatEuros(tx.montantTva)}</span>
            </div>
          ))
        ) : (
          <p className="text-xs italic text-encre/75">{t("tvaNonApplicable")}</p>
        )}
        <div className="flex justify-between border-t border-encre/20 pt-1 text-base font-medium text-encre">
          <span>{t("totalTtc")}</span>
          <span className="font-mono">{formatEuros(totaux.montantTtc)}</span>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor={`${idPrefix}-notes`}>
          {t("notes")}
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

      <SubmitButton>{t("enregistrer")}</SubmitButton>
    </form>
  );
}
