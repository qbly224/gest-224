"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("auth.connexion");
  const [state, formAction] = useActionState(signIn, initialActionState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      {reinitialise && <p className={ledgerNoticeClass}>{t("reinitialiseMessage")}</p>}
      {compteSupprime && <p className={ledgerNoticeClass}>{t("compteSupprimeMessage")}</p>}
      {state.error && <p className={ledgerErrorClass}>{state.error}</p>}

      <div>
        <label className={ledgerLabelClass} htmlFor="email">
          {t("email")}
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
          {t("motDePasse")}
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
          className="font-sans text-xs text-encre/75 underline underline-offset-2"
        >
          {t("motDePasseOublie")}
        </Link>
      </div>

      <div className="pt-2">
        <SubmitButton fullWidth variant="stamp">
          {t("seConnecter")}
        </SubmitButton>
      </div>

      <p className="border-t border-encre/10 pt-4 text-center font-sans text-sm text-encre/70">
        {t("pasDeCompte")}{" "}
        <Link href="/inscription" className="font-medium text-encre underline">
          {t("creerEntreprise")}
        </Link>
      </p>
    </form>
  );
}
