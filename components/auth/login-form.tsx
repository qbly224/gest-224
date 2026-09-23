"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/actions/types";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { inputClass, labelClass } from "@/lib/ui";

export function LoginForm({
  reinitialise,
  compteSupprime,
}: {
  reinitialise?: boolean;
  compteSupprime?: boolean;
}) {
  const [state, formAction] = useActionState(signIn, initialActionState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {reinitialise && (
        <p className="rounded-sm bg-encre/10 px-3 py-2 font-sans text-sm text-encre">
          Mot de passe réinitialisé. Vous pouvez vous connecter.
        </p>
      )}
      {compteSupprime && (
        <p className="rounded-sm bg-encre/10 px-3 py-2 font-sans text-sm text-encre">
          Votre compte a été supprimé.
        </p>
      )}
      {state.error && (
        <p className="rounded-sm bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label className={labelClass} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className={inputClass}
        />
        <FieldError messages={state.fieldErrors?.email} />
      </div>

      <div>
        <label className={labelClass} htmlFor="password">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className={inputClass}
        />
        <FieldError messages={state.fieldErrors?.password} />
      </div>

      <div className="flex items-center justify-between">
        <SubmitButton>Se connecter</SubmitButton>
        <Link href="/mot-de-passe-oublie" className="font-sans text-sm text-encre/70 underline">
          Mot de passe oublié ?
        </Link>
      </div>

      <p className="font-sans text-sm text-encre/70">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="underline">
          Créer une entreprise
        </Link>
      </p>
    </form>
  );
}
