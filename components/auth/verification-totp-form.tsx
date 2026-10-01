"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { verifierTotpConnexion } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/actions/types";
import { ledgerInputClass, ledgerLabelClass, ledgerErrorClass } from "@/lib/auth-ui";
import { SubmitButton } from "@/components/forms/submit-button";

export function VerificationTotpForm() {
  const t = useTranslations("auth.verificationTotp");
  const [state, formAction] = useActionState(verifierTotpConnexion, initialActionState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      {state.error && <p className={ledgerErrorClass}>{state.error}</p>}

      <div>
        <label className={ledgerLabelClass} htmlFor="code">
          {t("champCode")}
        </label>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={11}
          required
          className={`${ledgerInputClass} text-center font-mono text-lg tracking-widest`}
        />
        <p className="mt-1 font-sans text-xs text-encre/70">{t("aide")}</p>
      </div>

      <div className="pt-2">
        <SubmitButton fullWidth variant="stamp">
          {t("valider")}
        </SubmitButton>
      </div>
    </form>
  );
}
