"use client";

import { useActionState } from "react";
import { reinitialiserMotDePasse } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/actions/types";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { inputClass, labelClass } from "@/lib/ui";

export function ReinitialiserForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(reinitialiserMotDePasse, initialActionState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />

      {state.error && (
        <p className="rounded-sm bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label className={labelClass} htmlFor="password">
          Nouveau mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className={inputClass}
        />
        <FieldError messages={state.fieldErrors?.password} />
      </div>

      <SubmitButton fullWidth>Réinitialiser le mot de passe</SubmitButton>
    </form>
  );
}
