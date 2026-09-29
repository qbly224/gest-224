"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { FactureRecurrente, RegimeTva } from "@prisma/client";
import { initialActionState, type ActionState } from "@/lib/actions/types";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { TAUX_TVA_AUTORISES } from "@/lib/validation/article";
import { inputClass, labelClass, selectClass } from "@/lib/ui";

type FactureRecurrenteFormAction = (
  prevState: ActionState,
  formData: FormData
) => Promise<ActionState>;

type SerializedModele = Omit<FactureRecurrente, "quantite" | "prixUnitaireHt" | "tauxTva" | "prochaineGenerationDate"> & {
  quantite: string;
  prixUnitaireHt: string;
  tauxTva: string | null;
  prochaineGenerationDate: string;
};

export function FactureRecurrenteForm({
  modele,
  clients,
  regimeTva,
  action,
}: {
  modele?: SerializedModele;
  clients: { id: string; label: string }[];
  regimeTva: RegimeTva;
  action: FactureRecurrenteFormAction;
}) {
  const t = useTranslations("app.facturesRecurrentes");
  const [state, formAction] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state.error && (
        <p className="rounded-sm bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label className={labelClass} htmlFor="clientId">
          {t("client")}
        </label>
        <select
          id="clientId"
          name="clientId"
          required
          defaultValue={modele?.clientId ?? ""}
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
        <label className={labelClass} htmlFor="designation">
          {t("designation")}
        </label>
        <input
          id="designation"
          name="designation"
          required
          defaultValue={modele?.designation ?? ""}
          className={inputClass}
        />
        <FieldError messages={state.fieldErrors?.designation} />
      </div>

      <div>
        <label className={labelClass} htmlFor="description">
          {t("description")}
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={modele?.description ?? ""}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass} htmlFor="quantite">
            {t("quantite")}
          </label>
          <input
            id="quantite"
            name="quantite"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={modele?.quantite ?? "1"}
            className={`${inputClass} font-mono`}
          />
          <FieldError messages={state.fieldErrors?.quantite} />
        </div>
        <div>
          <label className={labelClass} htmlFor="prixUnitaireHt">
            {t("prixUnitaireHt")}
          </label>
          <input
            id="prixUnitaireHt"
            name="prixUnitaireHt"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={modele?.prixUnitaireHt ?? ""}
            className={`${inputClass} font-mono`}
          />
          <FieldError messages={state.fieldErrors?.prixUnitaireHt} />
        </div>
        {regimeTva === "normal" ? (
          <div>
            <label className={labelClass} htmlFor="tauxTva">
              {t("tauxTva")}
            </label>
            <select
              id="tauxTva"
              name="tauxTva"
              defaultValue={modele?.tauxTva ?? "20"}
              className={selectClass}
            >
              {TAUX_TVA_AUTORISES.map((taux) => (
                <option key={taux} value={taux}>
                  {taux} %
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <p className={labelClass}>{t("tva")}</p>
            <p className="mt-2 font-mono text-sm text-encre/60">{t("tvaNonApplicable")}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="frequence">
            {t("frequence")}
          </label>
          <select
            id="frequence"
            name="frequence"
            required
            defaultValue={modele?.frequence ?? "mensuelle"}
            className={selectClass}
          >
            <option value="mensuelle">{t("mensuelle")}</option>
            <option value="trimestrielle">{t("trimestrielle")}</option>
            <option value="annuelle">{t("annuelle")}</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="prochaineGenerationDate">
            {t("prochaineGenerationDate")}
          </label>
          <input
            id="prochaineGenerationDate"
            name="prochaineGenerationDate"
            type="date"
            required
            defaultValue={
              modele?.prochaineGenerationDate ?? new Date().toISOString().slice(0, 10)
            }
            className={`${inputClass} font-mono`}
          />
          <FieldError messages={state.fieldErrors?.prochaineGenerationDate} />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="conditionsPaiement">
          {t("conditionsPaiement")}
        </label>
        <input
          id="conditionsPaiement"
          name="conditionsPaiement"
          defaultValue={modele?.conditionsPaiement ?? ""}
          className={inputClass}
        />
      </div>

      <p className="font-sans text-xs text-encre/50">{t("noteBrouillon")}</p>

      <SubmitButton>{t("enregistrer")}</SubmitButton>
    </form>
  );
}
