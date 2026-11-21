"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { initialActionState, type ActionState } from "@/lib/actions/types";
import { createAnnonce } from "@/lib/actions/annonces";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { inputClass, labelClass } from "@/lib/ui";

export function AnnonceForm() {
  const t = useTranslations("app.annonces");
  const [state, formAction] = useActionState<ActionState, FormData>(
    createAnnonce,
    initialActionState
  );

  return (
    <form action={formAction} className="mt-6 space-y-6">
      {state.error && (
        <p className="rounded-sm bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label className={labelClass} htmlFor="titre">
          {t("titreChamp")}
        </label>
        <input id="titre" name="titre" required className={inputClass} />
        <FieldError messages={state.fieldErrors?.titre} />
      </div>

      <div>
        <label className={labelClass} htmlFor="contenu">
          {t("contenu")}
        </label>
        <textarea id="contenu" name="contenu" required rows={6} className={inputClass} />
        <FieldError messages={state.fieldErrors?.contenu} />
      </div>

      <p className="font-sans text-xs text-encre/60">{t("avertissementDiffusion")}</p>

      <SubmitButton>{t("diffuser")}</SubmitButton>
    </form>
  );
}
