"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { demanderReinitialisation } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/actions/types";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { ledgerInputClass, ledgerLabelClass, ledgerNoticeClass } from "@/lib/auth-ui";

export function DemandeResetForm() {
  const t = useTranslations("auth.motDePasseOublie");
  const [state, formAction] = useActionState(demanderReinitialisation, initialActionState);

  if (state.success) {
    return (
      <div className="mt-8 space-y-4">
        <p className={ledgerNoticeClass}>{t("confirmationMessage")}</p>
        <Link href="/connexion" className="font-sans text-sm text-encre underline">
          {t("retourConnexion")}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div>
        <label className={ledgerLabelClass} htmlFor="email">
          {t("email")}
        </label>
        <input id="email" name="email" type="email" required className={ledgerInputClass} />
        <FieldError messages={state.fieldErrors?.email} />
      </div>

      <div className="pt-2">
        <SubmitButton fullWidth variant="stamp">
          {t("envoyerLeLien")}
        </SubmitButton>
      </div>

      <p className="border-t border-encre/10 pt-4 text-center font-sans text-sm text-encre/70">
        <Link href="/connexion" className="underline">
          {t("retourConnexion")}
        </Link>
      </p>
    </form>
  );
}
