"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/actions/types";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { ledgerInputClass, ledgerLabelClass, ledgerErrorClass, ledgerNoticeClass } from "@/lib/auth-ui";

export function LoginForm({
  reinitialise,
  compteSupprime,
}: {
  reinitialise?: boolean;
  compteSupprime?: boolean;
}) {
  const [state, formAction] = useActionState(signIn, initialActionState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      {reinitialise && (
        <p className={ledgerNoticeClass}>
          Mot de passe réinitialisé. Vous pouvez vous connecter.
        </p>
      )}
      {compteSupprime && (
        <p className={ledgerNoticeClass}>Votre compte a été supprimé.</p>
      )}
      {state.error && <p className={ledgerErrorClass}>{state.error}</p>}

      <div>
        <label className={ledgerLabelClass} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className={ledgerInputClass}
        />
        <FieldError messages={state.fieldErrors?.email} />
      </div>

      <div>
        <label className={ledgerLabelClass} htmlFor="password">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className={ledgerInputClass}
        />
        <FieldError messages={state.fieldErrors?.password} />
      </div>

      <div className="flex items-center justify-end">
        <Link
          href="/mot-de-passe-oublie"
          className="font-sans text-xs text-encre/60 underline underline-offset-2"
        >
          Mot de passe oublié ?
        </Link>
      </div>

      <div className="pt-2">
        <SubmitButton fullWidth variant="stamp">
          Se connecter
        </SubmitButton>
      </div>

      <p className="border-t border-encre/10 pt-4 text-center font-sans text-sm text-encre/70">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-medium text-encre underline">
          Créer une entreprise
        </Link>
      </p>
    </form>
  );
}
