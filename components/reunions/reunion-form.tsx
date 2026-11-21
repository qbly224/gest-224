"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { Reunion } from "@prisma/client";
import { initialActionState, type ActionState } from "@/lib/actions/types";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { inputClass, labelClass } from "@/lib/ui";

type ReunionFormAction = (
  prevState: ActionState,
  formData: FormData
) => Promise<ActionState>;

function versDateTimeInput(date: Date): string {
  const decalageMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - decalageMs).toISOString().slice(0, 16);
}

export function ReunionForm({
  reunion,
  action,
}: {
  reunion?: Reunion;
  action: ReunionFormAction;
}) {
  const t = useTranslations("app.reunions");
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
        <label className={labelClass} htmlFor="titre">
          {t("titreChamp")}
        </label>
        <input
          id="titre"
          name="titre"
          required
          defaultValue={reunion?.titre ?? ""}
          className={inputClass}
        />
        <FieldError messages={state.fieldErrors?.titre} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="date">
            {t("date")}
          </label>
          <input
            id="date"
            name="date"
            type="datetime-local"
            required
            defaultValue={versDateTimeInput(reunion?.date ?? new Date())}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.date} />
        </div>
        <div>
          <label className={labelClass} htmlFor="lieu">
            {t("lieu")}
          </label>
          <input
            id="lieu"
            name="lieu"
            placeholder={t("lieuPlaceholder")}
            defaultValue={reunion?.lieu ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="description">
          {t("description")}
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={reunion?.description ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="compteRendu">
          {t("compteRendu")}
        </label>
        <textarea
          id="compteRendu"
          name="compteRendu"
          rows={6}
          placeholder={t("compteRenduPlaceholder")}
          defaultValue={reunion?.compteRendu ?? ""}
          className={inputClass}
        />
      </div>

      <SubmitButton>{t("enregistrer")}</SubmitButton>
    </form>
  );
}
