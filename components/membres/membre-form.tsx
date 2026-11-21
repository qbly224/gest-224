"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { Membre } from "@prisma/client";
import { initialActionState, type ActionState } from "@/lib/actions/types";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { inputClass, labelClass, selectClass } from "@/lib/ui";

type MembreFormAction = (
  prevState: ActionState,
  formData: FormData
) => Promise<ActionState>;

function versDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function MembreForm({
  membre,
  action,
}: {
  membre?: Membre;
  action: MembreFormAction;
}) {
  const t = useTranslations("app.membres");
  const [state, formAction] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="mt-6 space-y-6">
      {state.success && (
        <p className="rounded-sm bg-encre/10 px-3 py-2 font-sans text-sm text-encre">
          {t("enregistre")}
        </p>
      )}
      {state.error && (
        <p className="rounded-sm bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass} htmlFor="civilite">
            {t("civilite")}
          </label>
          <input
            id="civilite"
            name="civilite"
            defaultValue={membre?.civilite ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="prenom">
            {t("prenom")}
          </label>
          <input
            id="prenom"
            name="prenom"
            required
            defaultValue={membre?.prenom ?? ""}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.prenom} />
        </div>
        <div>
          <label className={labelClass} htmlFor="nom">
            {t("nom")}
          </label>
          <input
            id="nom"
            name="nom"
            required
            defaultValue={membre?.nom ?? ""}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.nom} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="role">
            {t("role")}
          </label>
          <select
            id="role"
            name="role"
            defaultValue={membre?.role ?? "membre"}
            className={selectClass}
          >
            <option value="president">{t("rolePresident")}</option>
            <option value="vice_president">{t("roleVicePresident")}</option>
            <option value="tresorier">{t("roleTresorier")}</option>
            <option value="secretaire">{t("roleSecretaire")}</option>
            <option value="membre">{t("roleMembre")}</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="statut">
            {t("statut")}
          </label>
          <select
            id="statut"
            name="statut"
            defaultValue={membre?.statut ?? "actif"}
            className={selectClass}
          >
            <option value="actif">{t("statutActif")}</option>
            <option value="suspendu">{t("statutSuspendu")}</option>
            <option value="radie">{t("statutRadie")}</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="dateAdhesion">
          {t("dateAdhesion")}
        </label>
        <input
          id="dateAdhesion"
          name="dateAdhesion"
          type="date"
          required
          defaultValue={versDateInput(membre?.dateAdhesion ?? new Date())}
          className={inputClass}
        />
        <FieldError messages={state.fieldErrors?.dateAdhesion} />
      </div>

      <fieldset className="space-y-4 border-t border-encre/10 pt-4">
        <legend className="font-titre text-lg text-encre">{t("contact")}</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="email">
              {t("email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={membre?.email ?? ""}
              className={inputClass}
            />
            <FieldError messages={state.fieldErrors?.email} />
          </div>
          <div>
            <label className={labelClass} htmlFor="telephone">
              {t("telephone")}
            </label>
            <input
              id="telephone"
              name="telephone"
              defaultValue={membre?.telephone ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-encre/10 pt-4">
        <legend className="font-titre text-lg text-encre">{t("adresse")}</legend>
        <div>
          <label className={labelClass} htmlFor="adresseLigne1">
            {t("adresseLigne1")}
          </label>
          <input
            id="adresseLigne1"
            name="adresseLigne1"
            defaultValue={membre?.adresseLigne1 ?? ""}
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass} htmlFor="codePostal">
              {t("codePostal")}
            </label>
            <input
              id="codePostal"
              name="codePostal"
              defaultValue={membre?.codePostal ?? ""}
              className={inputClass}
            />
          </div>
          <div className="col-span-2">
            <label className={labelClass} htmlFor="ville">
              {t("ville")}
            </label>
            <input
              id="ville"
              name="ville"
              defaultValue={membre?.ville ?? ""}
              className={inputClass}
            />
          </div>
        </div>
        <input type="hidden" name="pays" value="France" />
      </fieldset>

      <div>
        <label className={labelClass} htmlFor="notes">
          {t("notes")}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={membre?.notes ?? ""}
          className={inputClass}
        />
      </div>

      <fieldset className="space-y-4 border-t border-encre/10 pt-4">
        <legend className="font-titre text-lg text-encre">{t("relances")}</legend>
        <div>
          <label className={labelClass} htmlFor="relanceFrequence">
            {t("relanceFrequence")}
          </label>
          <select
            id="relanceFrequence"
            name="relanceFrequence"
            defaultValue={
              membre && !membre.relancesActivees
                ? "desactivee"
                : String(membre?.relanceIntervalleJours ?? 7)
            }
            className={selectClass}
          >
            <option value="desactivee">{t("relanceDesactivee")}</option>
            <option value="1">{t("relanceQuotidienne")}</option>
            <option value="7">{t("relanceHebdomadaire")}</option>
            <option value="10">{t("relance3xMois")}</option>
            <option value="15">{t("relance2xMois")}</option>
            <option value="30">{t("relanceMensuelle")}</option>
          </select>
          <p className="mt-1 font-sans text-xs text-encre/70">{t("relanceAide")}</p>
        </div>
      </fieldset>

      <SubmitButton>{t("enregistrer")}</SubmitButton>
    </form>
  );
}
