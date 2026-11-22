"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { signUp } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/actions/types";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { ledgerInputClass, ledgerLabelClass, ledgerSelectClass, ledgerErrorClass } from "@/lib/auth-ui";
import { LISTE_PLANS } from "@/lib/plans";
import type { PlanAbonnement } from "@prisma/client";

type TypeCompte = "entreprise" | "association";

export function SignUpForm({
  planInitial,
  typeCompteInitial = "entreprise",
}: {
  planInitial: PlanAbonnement;
  typeCompteInitial?: TypeCompte;
}) {
  const t = useTranslations("auth.inscription");
  const tPlans = useTranslations("plans");
  const [state, formAction] = useActionState(signUp, initialActionState);
  const [plan, setPlan] = useState<PlanAbonnement>(
    typeCompteInitial === "association" ? "starter" : planInitial
  );
  const [typeCompte, setTypeCompte] = useState<TypeCompte>(typeCompteInitial);

  return (
    <form action={formAction} className="mt-8 space-y-7">
      {state.error && <p className={ledgerErrorClass}>{state.error}</p>}

      <fieldset className="space-y-2">
        <legend className="font-titre text-lg text-encre">{t("typeCompte")}</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["entreprise", "association"] as const).map((tc) => (
            <button
              key={tc}
              type="button"
              onClick={() => {
                setTypeCompte(tc);
                // Un compte association n'a qu'un seul plan, payant, sans
                // palier (cf. lib/plans.ts, limitesEffectives) : pas de
                // choix à faire, contrairement à une entreprise.
                if (tc === "association") setPlan("starter");
                else setPlan(planInitial);
              }}
              className={`rounded-sm border px-3 py-2 text-center font-sans text-sm transition-colors ${
                typeCompte === tc
                  ? "border-encre bg-encre text-ivoire"
                  : "border-encre/30 text-encre hover:bg-encre/5"
              }`}
            >
              {tc === "entreprise" ? t("typeCompteEntreprise") : t("typeCompteAssociation")}
            </button>
          ))}
        </div>
        <input type="hidden" name="typeCompte" value={typeCompte} />
      </fieldset>

      {typeCompte === "entreprise" ? (
        <fieldset className="space-y-2">
          <legend className="font-titre text-lg text-encre">{t("plan")}</legend>
          <input type="hidden" name="plan" value={plan} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {LISTE_PLANS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlan(p.id)}
                className={`rounded-sm border px-2 py-2 text-center font-sans text-xs transition-colors ${
                  plan === p.id
                    ? "border-encre bg-encre text-ivoire"
                    : "border-encre/30 text-encre hover:bg-encre/5"
                }`}
              >
                <div className="font-medium">{tPlans(`${p.id}.label`)}</div>
                <div className="font-mono">
                  {p.prixMensuel === 0 ? "0 €" : `${p.prixMensuel} €${t("parMois")}`}
                </div>
              </button>
            ))}
          </div>
          <p className="font-sans text-xs text-encre/75">
            <Link href="/tarifs" className="underline">
              {t("comparerPlans")}
            </Link>{" "}
            - {t("modifiablePlus")}
          </p>
          {plan !== "gratuit" && (
            <p className="font-sans text-xs text-encre/75">{t("essaiGratuit")}</p>
          )}
        </fieldset>
      ) : (
        <fieldset className="space-y-2">
          <legend className="font-titre text-lg text-encre">{t("plan")}</legend>
          <input type="hidden" name="plan" value="starter" />
          <div className="rounded-sm border border-encre/30 bg-encre/5 px-4 py-3">
            <p className="font-sans text-sm text-encre">{t("planAssociationTitre")}</p>
            <p className="mt-1 font-sans text-xs text-encre/75">{t("planAssociationDescription")}</p>
          </div>
        </fieldset>
      )}

      <fieldset className="space-y-4 border-t border-encre/10 pt-5">
        <legend className="font-titre text-lg text-encre">
          {typeCompte === "entreprise" ? t("entreprise") : t("association")}
        </legend>

        <div>
          <label className={ledgerLabelClass} htmlFor="raisonSociale">
            {typeCompte === "entreprise" ? t("raisonSociale") : t("raisonSocialeAssociation")}
          </label>
          <input
            id="raisonSociale"
            name="raisonSociale"
            required
            className={ledgerInputClass}
          />
          <FieldError messages={state.fieldErrors?.raisonSociale} />
        </div>

        {typeCompte === "entreprise" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={ledgerLabelClass} htmlFor="siret">
                {t("siret")}
              </label>
              <input
                id="siret"
                name="siret"
                required
                maxLength={14}
                placeholder={t("siretPlaceholder")}
                className={ledgerInputClass}
              />
              <p className="mt-1 font-sans text-xs text-encre/70">{t("siretAide")}</p>
              <FieldError messages={state.fieldErrors?.siret} />
            </div>

            <div>
              <label className={ledgerLabelClass} htmlFor="regimeTva">
                {t("regimeTva")}
              </label>
              <select
                id="regimeTva"
                name="regimeTva"
                required
                defaultValue="franchise"
                className={ledgerSelectClass}
              >
                <option value="franchise">{t("regimeFranchise")}</option>
                <option value="normal">{t("regimeNormal")}</option>
              </select>
              <p className="mt-1 font-sans text-xs text-encre/70">{t("regimeAide")}</p>
              <FieldError messages={state.fieldErrors?.regimeTva} />
            </div>
          </div>
        ) : (
          <div>
            <label className={ledgerLabelClass} htmlFor="numeroRna">
              {t("numeroRna")}
            </label>
            <input
              id="numeroRna"
              name="numeroRna"
              maxLength={20}
              placeholder={t("numeroRnaPlaceholder")}
              className={ledgerInputClass}
            />
            <p className="mt-1 font-sans text-xs text-encre/70">{t("numeroRnaAide")}</p>
            <FieldError messages={state.fieldErrors?.numeroRna} />
          </div>
        )}

        <div>
          <label className={ledgerLabelClass} htmlFor="adresseLigne1">
            {t("adresse")}
          </label>
          <input
            id="adresseLigne1"
            name="adresseLigne1"
            required
            className={ledgerInputClass}
          />
          <FieldError messages={state.fieldErrors?.adresseLigne1} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={ledgerLabelClass} htmlFor="codePostal">
              {t("codePostal")}
            </label>
            <input
              id="codePostal"
              name="codePostal"
              required
              className={ledgerInputClass}
            />
            <FieldError messages={state.fieldErrors?.codePostal} />
          </div>
          <div className="col-span-2">
            <label className={ledgerLabelClass} htmlFor="ville">
              {t("ville")}
            </label>
            <input id="ville" name="ville" required className={ledgerInputClass} />
            <FieldError messages={state.fieldErrors?.ville} />
          </div>
        </div>
        <input type="hidden" name="pays" value="France" />
      </fieldset>

      <fieldset className="space-y-4 border-t border-encre/10 pt-5">
        <legend className="font-titre text-lg text-encre">{t("votreCompte")}</legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={ledgerLabelClass} htmlFor="prenom">
              {t("prenom")}
            </label>
            <input
              id="prenom"
              name="prenom"
              required
              className={ledgerInputClass}
            />
            <FieldError messages={state.fieldErrors?.prenom} />
          </div>
          <div>
            <label className={ledgerLabelClass} htmlFor="nom">
              {t("nom")}
            </label>
            <input id="nom" name="nom" required className={ledgerInputClass} />
            <FieldError messages={state.fieldErrors?.nom} />
          </div>
        </div>

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
            minLength={8}
            className={ledgerInputClass}
          />
          <FieldError messages={state.fieldErrors?.password} />
        </div>
      </fieldset>

      <label className="flex items-start gap-2 font-sans text-sm text-encre/80">
        <input type="checkbox" name="accepteCgu" required className="mt-0.5" />
        <span>
          {t("accepte")}{" "}
          <Link href="/cgu" target="_blank" className="underline">
            {t("cgu")}
          </Link>
          , {t("les")}{" "}
          <Link href="/cgv" target="_blank" className="underline">
            {t("cgv")}
          </Link>{" "}
          {t("et")}{" "}
          <Link href="/confidentialite" target="_blank" className="underline">
            {t("confidentialite")}
          </Link>
          .
        </span>
      </label>

      <SubmitButton fullWidth variant="stamp">
        {t("creerMonEspace")}
      </SubmitButton>

      <p className="font-sans text-sm text-encre/70">
        {t("dejaInscrit")}{" "}
        <Link href="/connexion" className="underline">
          {t("seConnecter")}
        </Link>
      </p>
    </form>
  );
}
