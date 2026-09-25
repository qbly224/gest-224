"use client";

import { useActionState } from "react";
import { reinitialiserMotDePasse } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/actions/types";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { ledgerInputClass, ledgerLabelClass, ledgerErrorClass } from "@/lib/auth-ui";

export function ReinitialiserForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(reinitialiserMotDePasse, initialActionState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <input type="hidden" name="token" value={token} />

      {state.error && <p className={ledgerErrorClass}>{state.error}</p>}

      <div>
        <label className={ledgerLabelClass} htmlFor="password">
          Nouveau mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className={ledgerInputClass}
        />
        <FieldError messages={state.fieldErrors?.password} />
      </div>

      <div className="pt-2">
        <SubmitButton fullWidth variant="stamp">
          Réinitialiser le mot de passe
        </SubmitButton>
      </div>
    </form>
  );
}
