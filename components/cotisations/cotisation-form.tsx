"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import type { Cotisation } from "@prisma/client";
import { initialActionState, type ActionState } from "@/lib/actions/types";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { inputClass, labelClass, selectClass } from "@/lib/ui";
import { MOYENS_PAIEMENT, LABELS_MOYEN_PAIEMENT } from "@/lib/paiement-moyens";

type CotisationFormAction = (
  prevState: ActionState,
  formData: FormData
) => Promise<ActionState>;

type SerializedCotisation = Omit<Cotisation, "montant"> & { montant: string };

export function CotisationForm({
  cotisation,
  membres,
  membreIdInitial,
  action,
}: {
  cotisation?: SerializedCotisation;
  membres: { id: string; prenom: string; nom: string }[];
  membreIdInitial?: string;
  action: CotisationFormAction;
}) {
  const t = useTranslations("app.cotisations");
  const [state, formAction] = useActionState(action, initialActionState);
  const [payee, setPayee] = useState(Boolean(cotisation?.datePaiement));

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
        <label className={labelClass} htmlFor="membreId">
          {t("membre")}
        </label>
        <select
          id="membreId"
          name="membreId"
          required
          defaultValue={cotisation?.membreId ?? membreIdInitial ?? ""}
          className={selectClass}
        >
          <option value="" disabled>
            {t("choisirMembre")}
          </option>
          {membres.map((membre) => (
            <option key={membre.id} value={membre.id}>
              {membre.prenom} {membre.nom}
            </option>
          ))}
        </select>
        <FieldError messages={state.fieldErrors?.membreId} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="periode">
            {t("periode")}
          </label>
          <input
            id="periode"
            name="periode"
            required
            placeholder={t("periodePlaceholder")}
            defaultValue={cotisation?.periode ?? ""}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.periode} />
        </div>
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
            defaultValue={cotisation?.montant ?? ""}
            className={`${inputClass} font-mono`}
          />
          <FieldError messages={state.fieldErrors?.montant} />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 font-sans text-sm text-encre">
          <input
            type="checkbox"
            checked={payee}
            onChange={(e) => setPayee(e.target.checked)}
          />
          {t("dejaPayee")}
        </label>
      </div>

      {payee && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="datePaiement">
              {t("datePaiement")}
            </label>
            <input
              id="datePaiement"
              name="datePaiement"
              type="date"
              defaultValue={
                cotisation?.datePaiement
                  ? cotisation.datePaiement.toISOString().slice(0, 10)
                  : new Date().toISOString().slice(0, 10)
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="moyenPaiement">
              {t("moyenPaiement")}
            </label>
            <select
              id="moyenPaiement"
              name="moyenPaiement"
              defaultValue={cotisation?.moyenPaiement ?? ""}
              className={selectClass}
            >
              <option value="">-</option>
              {MOYENS_PAIEMENT.map((moyen) => (
                <option key={moyen} value={moyen}>
                  {LABELS_MOYEN_PAIEMENT[moyen]}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <SubmitButton>{t("enregistrer")}</SubmitButton>
    </form>
  );
}
