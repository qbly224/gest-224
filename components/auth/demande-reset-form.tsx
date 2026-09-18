"use client";

import { useActionState } from "react";
import Link from "next/link";
import { demanderReinitialisation } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/actions/types";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { inputClass, labelClass } from "@/lib/ui";

export function DemandeResetForm() {
  const [state, formAction] = useActionState(demanderReinitialisation, initialActionState);

  if (state.success) {
    return (
      <div className="mt-6 space-y-4">
        <p className="rounded-sm bg-encre/10 px-3 py-2 font-sans text-sm text-encre">
          Si un compte existe avec cette adresse, un email contenant un lien
          de réinitialisation vient d&apos;être envoyé (valable une heure).
        </p>
        <Link href="/connexion" className="font-sans text-sm text-encre underline">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label className={labelClass} htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" required className={inputClass} />
        <FieldError messages={state.fieldErrors?.email} />
      </div>

      <SubmitButton>Envoyer le lien de réinitialisation</SubmitButton>

      <p className="font-sans text-sm text-encre/70">
        <Link href="/connexion" className="underline">
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}
