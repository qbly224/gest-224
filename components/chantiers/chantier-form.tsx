"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { Chantier } from "@prisma/client";
import { initialActionState, type ActionState } from "@/lib/actions/types";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { inputClass, labelClass, selectClass } from "@/lib/ui";

type ChantierFormAction = (
  prevState: ActionState,
  formData: FormData
) => Promise<ActionState>;

type SerializedChantier = Omit<
  Chantier,
  "montant" | "dateDebut" | "dateEcheance" | "dateRealisation"
> & {
  montant: string | null;
  dateDebut: string | null;
  dateEcheance: string | null;
};

export function ChantierForm({
  chantier,
  clients,
  action,
}: {
  chantier?: SerializedChantier;
  clients: { id: string; label: string }[];
  action: ChantierFormAction;
}) {
  const t = useTranslations("app.chantiers");
  const [state, formAction] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state.error && (
        <p className="rounded-sm bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label className={labelClass} htmlFor="titre">
          {t("champTitre")}
        </label>
        <input
          id="titre"
          name="titre"
          required
          defaultValue={chantier?.titre ?? ""}
          className={inputClass}
        />
        <FieldError messages={state.fieldErrors?.titre} />
      </div>

      <div>
        <label className={labelClass} htmlFor="clientId">
          {t("champClient")}
        </label>
        <select
          id="clientId"
          name="clientId"
          defaultValue={chantier?.clientId ?? ""}
          className={selectClass}
        >
          <option value="">{t("aucunClient")}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <FieldError messages={state.fieldErrors?.clientId} />
      </div>

      <div>
        <label className={labelClass} htmlFor="description">
          {t("champDescription")}
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={chantier?.description ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="adresse">
          {t("champAdresse")}
        </label>
        <input
          id="adresse"
          name="adresse"
          defaultValue={chantier?.adresse ?? ""}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="montant">
            {t("champMontant")}
          </label>
          <input
            id="montant"
            name="montant"
            type="number"
            step="0.01"
            min="0"
            defaultValue={chantier?.montant ?? ""}
            className={`${inputClass} font-mono`}
          />
          <FieldError messages={state.fieldErrors?.montant} />
        </div>
        <div>
          <label className={labelClass} htmlFor="statut">
            {t("champStatut")}
          </label>
          <select
            id="statut"
            name="statut"
            required
            defaultValue={chantier?.statut ?? "a_faire"}
            className={selectClass}
          >
            <option value="a_faire">{t("aFaire")}</option>
            <option value="en_cours">{t("enCours")}</option>
            <option value="fait">{t("fait")}</option>
            <option value="annule">{t("annule")}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="dateDebut">
            {t("champDateDebut")}
          </label>
          <input
            id="dateDebut"
            name="dateDebut"
            type="date"
            defaultValue={chantier?.dateDebut ?? ""}
            className={`${inputClass} font-mono`}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="dateEcheance">
            {t("champDateEcheance")}
          </label>
          <input
            id="dateEcheance"
            name="dateEcheance"
            type="date"
            defaultValue={chantier?.dateEcheance ?? ""}
            className={`${inputClass} font-mono`}
          />
        </div>
      </div>

      <SubmitButton>{t("enregistrer")}</SubmitButton>
    </form>
  );
}
