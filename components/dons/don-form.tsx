"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { Don } from "@prisma/client";
import { initialActionState, type ActionState } from "@/lib/actions/types";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { inputClass, labelClass, selectClass } from "@/lib/ui";

type DonFormAction = (prevState: ActionState, formData: FormData) => Promise<ActionState>;

type SerializedDon = Omit<Don, "montant"> & { montant: string };

export function DonForm({
  don,
  action,
}: {
  don?: SerializedDon;
  action: DonFormAction;
}) {
  const t = useTranslations("app.dons");
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

      <div>
        <label className={labelClass} htmlFor="type">
          {t("type")}
        </label>
        <select
          id="type"
          name="type"
          defaultValue={don?.type ?? "don"}
          className={selectClass}
        >
          <option value="don">{t("typeDon")}</option>
          <option value="subvention">{t("typeSubvention")}</option>
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="donateur">
          {t("donateur")}
        </label>
        <input
          id="donateur"
          name="donateur"
          required
          placeholder={t("donateurPlaceholder")}
          defaultValue={don?.donateur ?? ""}
          className={inputClass}
        />
        <FieldError messages={state.fieldErrors?.donateur} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="montant">
            {t("montant")}
          </label>
          <input
            id="montant"
            name="montant"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={don?.montant ?? ""}
            className={`${inputClass} font-mono`}
          />
          <FieldError messages={state.fieldErrors?.montant} />
        </div>
        <div>
          <label className={labelClass} htmlFor="date">
            {t("date")}
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={(don?.date ?? new Date()).toISOString().slice(0, 10)}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.date} />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="notes">
          {t("notes")}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={don?.notes ?? ""}
          className={inputClass}
        />
      </div>

      <SubmitButton>{t("enregistrer")}</SubmitButton>
    </form>
  );
}
