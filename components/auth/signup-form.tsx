"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUp } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/actions/types";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { ledgerInputClass, ledgerLabelClass, ledgerSelectClass, ledgerErrorClass } from "@/lib/auth-ui";
import { LISTE_PLANS } from "@/lib/plans";
import type { PlanAbonnement } from "@prisma/client";

export function SignUpForm({ planInitial }: { planInitial: PlanAbonnement }) {
  const [state, formAction] = useActionState(signUp, initialActionState);
  const [plan, setPlan] = useState<PlanAbonnement>(planInitial);

  return (
    <form action={formAction} className="mt-8 space-y-7">
      {state.error && <p className={ledgerErrorClass}>{state.error}</p>}

      <fieldset className="space-y-2">
        <legend className="font-titre text-lg text-encre">Plan</legend>
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
              <div className="font-medium">{p.label}</div>
              <div className="font-mono">
                {p.prixMensuel === 0 ? "0 €" : `${p.prixMensuel} €/mois`}
              </div>
            </button>
          ))}
        </div>
        <p className="font-sans text-xs text-encre/60">
          <Link href="/tarifs" className="underline">
            Comparer les plans
          </Link>{" "}
          — modifiable à tout moment depuis votre espace.
        </p>
      </fieldset>

      <fieldset className="space-y-4 border-t border-encre/10 pt-5">
        <legend className="font-titre text-lg text-encre">Entreprise</legend>

        <div>
          <label className={ledgerLabelClass} htmlFor="raisonSociale">
            Raison sociale
          </label>
          <input
            id="raisonSociale"
            name="raisonSociale"
            required
            className={ledgerInputClass}
          />
          <FieldError messages={state.fieldErrors?.raisonSociale} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={ledgerLabelClass} htmlFor="siret">
              SIRET
            </label>
            <input
              id="siret"
              name="siret"
              required
              maxLength={14}
              placeholder="14 chiffres"
              className={ledgerInputClass}
            />
            <p className="mt-1 font-sans text-xs text-encre/50">
              Sans espaces, sur votre extrait Kbis ou sur{" "}
              <span className="italic">annuaire-entreprises.data.gouv.fr</span>.
            </p>
            <FieldError messages={state.fieldErrors?.siret} />
          </div>

          <div>
            <label className={ledgerLabelClass} htmlFor="regimeTva">
              Régime de TVA
            </label>
            <select
              id="regimeTva"
              name="regimeTva"
              required
              defaultValue="franchise"
              className={ledgerSelectClass}
            >
              <option value="franchise">
                Franchise en base (auto-entrepreneur)
              </option>
              <option value="normal">Régime normal</option>
            </select>
            <p className="mt-1 font-sans text-xs text-encre/50">
              En doute ? La plupart des auto-entrepreneurs sont en franchise en
              base (pas de TVA facturée). Votre expert-comptable confirme si besoin.
            </p>
            <FieldError messages={state.fieldErrors?.regimeTva} />
          </div>
        </div>

        <div>
          <label className={ledgerLabelClass} htmlFor="adresseLigne1">
            Adresse
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
              Code postal
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
              Ville
            </label>
            <input id="ville" name="ville" required className={ledgerInputClass} />
            <FieldError messages={state.fieldErrors?.ville} />
          </div>
        </div>
        <input type="hidden" name="pays" value="France" />
      </fieldset>

      <fieldset className="space-y-4 border-t border-encre/10 pt-5">
        <legend className="font-titre text-lg text-encre">
          Votre compte
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={ledgerLabelClass} htmlFor="prenom">
              Prénom
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
              Nom
            </label>
            <input id="nom" name="nom" required className={ledgerInputClass} />
            <FieldError messages={state.fieldErrors?.nom} />
          </div>
        </div>

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
            minLength={8}
            className={ledgerInputClass}
          />
          <FieldError messages={state.fieldErrors?.password} />
        </div>
      </fieldset>

      <label className="flex items-start gap-2 font-sans text-sm text-encre/80">
        <input type="checkbox" name="accepteCgu" required className="mt-0.5" />
        <span>
          J&apos;accepte les{" "}
          <Link href="/cgu" target="_blank" className="underline">
            conditions générales d&apos;utilisation
          </Link>
          , les{" "}
          <Link href="/cgv" target="_blank" className="underline">
            conditions générales de vente
          </Link>{" "}
          et la{" "}
          <Link href="/confidentialite" target="_blank" className="underline">
            politique de confidentialité
          </Link>
          .
        </span>
      </label>

      <SubmitButton fullWidth variant="stamp">
        Créer mon espace
      </SubmitButton>

      <p className="font-sans text-sm text-encre/70">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
