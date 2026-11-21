"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { LigneBudget } from "@prisma/client";
import { initialActionState, type ActionState } from "@/lib/actions/types";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { inputClass, labelClass, selectClass } from "@/lib/ui";

type LigneFormAction = (prevState: ActionState, formData: FormData) => Promise<ActionState>;

type SerializedLigne = Omit<LigneBudget, "montantPrevu"> & { montantPrevu: string };

export function LigneBudgetForm({
  ligne,
  anneeInitiale,
  typeInitial,
  action,
}: {
  ligne?: SerializedLigne;
  anneeInitiale?: number;
  typeInitial?: "recette" | "depense";
  action: LigneFormAction;
}) {
  const t = useTranslations("app.budget");
  const [state, formAction] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="rounded-sm bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="annee">
            {t("annee")}
          </label>
          <input
            id="annee"
            name="annee"
            type="number"
            required
            defaultValue={ligne?.annee ?? anneeInitiale ?? new Date().getFullYear()}
            className={`${inputClass} font-mono`}
          />
          <FieldError messages={state.fieldErrors?.annee} />
        </div>
        <div>
          <label className={labelClass} htmlFor="type">
            {t("type")}
          </label>
          <select
            id="type"
            name="type"
            defaultValue={ligne?.type ?? typeInitial ?? "recette"}
            className={selectClass}
          >
            <option value="recette">{t("typeRecette")}</option>
            <option value="depense">{t("typeDepense")}</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="categorie">
          {t("categorie")}
        </label>
        <input
          id="categorie"
          name="categorie"
          required
          placeholder={t("categoriePlaceholder")}
          defaultValue={ligne?.categorie ?? ""}
          className={inputClass}
        />
        <FieldError messages={state.fieldErrors?.categorie} />
      </div>

      <div>
        <label className={labelClass} htmlFor="montantPrevu">
          {t("montantPrevu")}
        </label>
        <input
          id="montantPrevu"
          name="montantPrevu"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={ligne?.montantPrevu ?? ""}
          className={`${inputClass} font-mono`}
        />
        <FieldError messages={state.fieldErrors?.montantPrevu} />
      </div>

      <div>
        <label className={labelClass} htmlFor="notes">
          {t("notes")}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={ligne?.notes ?? ""}
          className={inputClass}
        />
      </div>

      <SubmitButton>{t("enregistrer")}</SubmitButton>
    </form>
  );
}
