"use client";

import { useActionState } from "react";
import type { Depense } from "@prisma/client";
import { initialActionState, type ActionState } from "@/lib/actions/types";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { inputClass, labelClass } from "@/lib/ui";

type DepenseFormAction = (
  prevState: ActionState,
  formData: FormData
) => Promise<ActionState>;

type SerializedDepense = Omit<Depense, "montant"> & { montant: string };

export function DepenseForm({
  depense,
  action,
}: {
  depense?: SerializedDepense;
  action: DepenseFormAction;
}) {
  const [state, formAction] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state.error && (
        <p className="rounded-sm bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label className={labelClass} htmlFor="date">
          Date
        </label>
        <input
          id="date"
          name="date"
          type="date"
          required
          defaultValue={
            depense ? depense.date.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
          }
          className={`${inputClass} font-mono`}
        />
        <FieldError messages={state.fieldErrors?.date} />
      </div>

      <div>
        <label className={labelClass} htmlFor="libelle">
          Libellé
        </label>
        <input
          id="libelle"
          name="libelle"
          required
          defaultValue={depense?.libelle ?? ""}
          className={inputClass}
        />
        <FieldError messages={state.fieldErrors?.libelle} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="montant">
            Montant (€)
          </label>
          <input
            id="montant"
            name="montant"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={depense?.montant ?? ""}
            className={`${inputClass} font-mono`}
          />
          <FieldError messages={state.fieldErrors?.montant} />
        </div>
        <div>
          <label className={labelClass} htmlFor="categorie">
            Catégorie (libre)
          </label>
          <input
            id="categorie"
            name="categorie"
            defaultValue={depense?.categorie ?? ""}
            placeholder="Ex. Fournitures, Loyer, Carburant..."
            className={inputClass}
          />
        </div>
      </div>

      <SubmitButton>Enregistrer</SubmitButton>
    </form>
  );
}
