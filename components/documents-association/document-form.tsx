"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { initialActionState, type ActionState } from "@/lib/actions/types";
import { ajouterDocumentAssociatif } from "@/lib/actions/documents-associatifs";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { inputClass, labelClass, selectClass } from "@/lib/ui";

const CATEGORIES = [
  "statuts",
  "reglement_interieur",
  "proces_verbal",
  "rapport_activite",
  "administratif",
  "autre",
] as const;

export function DocumentAssociatifForm() {
  const t = useTranslations("app.documents");
  const [state, formAction] = useActionState<ActionState, FormData>(
    ajouterDocumentAssociatif,
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
        <label className={labelClass} htmlFor="categorie">
          {t("categorie")}
        </label>
        <select id="categorie" name="categorie" defaultValue="autre" className={selectClass}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(`categories.${c}`)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="fichier">
          {t("fichier")}
        </label>
        <input
          id="fichier"
          type="file"
          name="fichier"
          accept="application/pdf,image/png,image/jpeg,image/webp"
          required
          className="font-sans text-sm text-encre/85 file:mr-3 file:rounded-sm file:border file:border-encre/30 file:bg-transparent file:px-3 file:py-1.5 file:font-sans file:text-sm file:text-encre hover:file:bg-encre/5"
        />
      </div>

      <SubmitButton>{t("ajouter")}</SubmitButton>
    </form>
  );
}
