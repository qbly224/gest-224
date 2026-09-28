"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { Article, RegimeTva } from "@prisma/client";
import { initialActionState, type ActionState } from "@/lib/actions/types";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { TAUX_TVA_AUTORISES } from "@/lib/validation/article";
import { inputClass, labelClass, selectClass } from "@/lib/ui";

type ArticleFormAction = (
  prevState: ActionState,
  formData: FormData
) => Promise<ActionState>;

type SerializedArticle = Omit<Article, "prixUnitaireHt" | "tauxTva"> & {
  prixUnitaireHt: string;
  tauxTva: string | null;
};

export function ArticleForm({
  article,
  regimeTva,
  action,
}: {
  article?: SerializedArticle;
  regimeTva: RegimeTva;
  action: ArticleFormAction;
}) {
  const t = useTranslations("app.catalogue");
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
          defaultValue={article?.type ?? "service"}
          className={selectClass}
        >
          <option value="service">{t("service")}</option>
          <option value="produit">{t("produit")}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="reference">
            {t("reference")}
          </label>
          <input
            id="reference"
            name="reference"
            defaultValue={article?.reference ?? ""}
            className={`${inputClass} font-mono`}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="uniteMesure">
            {t("unite")}
          </label>
          <input
            id="uniteMesure"
            name="uniteMesure"
            defaultValue={article?.uniteMesure ?? "unité"}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="designation">
          {t("designation")}
        </label>
        <input
          id="designation"
          name="designation"
          required
          defaultValue={article?.designation ?? ""}
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
          rows={3}
          defaultValue={article?.description ?? ""}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            defaultValue={article?.prixUnitaireHt ?? ""}
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
              defaultValue={article?.tauxTva ?? "20"}
              className={selectClass}
            >
              {TAUX_TVA_AUTORISES.map((taux) => (
                <option key={taux} value={taux}>
                  {taux} %
                </option>
              ))}
            </select>
            <FieldError messages={state.fieldErrors?.tauxTva} />
          </div>
        ) : (
          <div>
            <p className={labelClass}>{t("tva")}</p>
            <p className="mt-2 font-mono text-sm text-encre/60">{t("tvaNonApplicable")}</p>
          </div>
        )}
      </div>

      <SubmitButton>{t("enregistrer")}</SubmitButton>
    </form>
  );
}
