"use client";

import { useActionState, useState } from "react";
import type { Tenant } from "@prisma/client";
import { updateEntreprise } from "@/lib/actions/entreprise";
import { initialActionState } from "@/lib/actions/types";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { inputClass, labelClass, selectClass } from "@/lib/ui";

type SerializedTenant = Omit<Tenant, "capitalSocial"> & {
  capitalSocial: string | null;
};

export function EntrepriseForm({ tenant }: { tenant: SerializedTenant }) {
  const [state, formAction] = useActionState(
    updateEntreprise,
    initialActionState
  );
  const [apercu, setApercu] = useState<string | null>(null);
  const [supprimer, setSupprimer] = useState(false);

  return (
    <form action={formAction} className="mt-6 space-y-6">
      {state.success && (
        <p className="rounded-sm bg-encre/10 px-3 py-2 font-sans text-sm text-encre">
          Fiche entreprise enregistrée.
        </p>
      )}
      {state.error && (
        <p className="rounded-sm bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
          {state.error}
        </p>
      )}

      <fieldset className="space-y-4">
        <legend className="font-titre text-lg text-encre">Identité</legend>

        <div>
          <label className={labelClass} htmlFor="raisonSociale">
            Raison sociale
          </label>
          <input
            id="raisonSociale"
            name="raisonSociale"
            required
            defaultValue={tenant.raisonSociale}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.raisonSociale} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="formeJuridique">
              Forme juridique
            </label>
            <input
              id="formeJuridique"
              name="formeJuridique"
              defaultValue={tenant.formeJuridique ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="siret">
              SIRET
            </label>
            <input
              id="siret"
              name="siret"
              required
              maxLength={14}
              defaultValue={tenant.siret}
              className={`${inputClass} font-mono`}
            />
            <p className="mt-1 font-sans text-xs text-encre/50">
              Sans espaces, sur votre extrait Kbis ou sur{" "}
              <span className="italic">annuaire-entreprises.data.gouv.fr</span>.
            </p>
            <FieldError messages={state.fieldErrors?.siret} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="siren">
              SIREN
            </label>
            <input
              id="siren"
              name="siren"
              defaultValue={tenant.siren ?? ""}
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="numeroTvaIntracom">
              N° TVA intracommunautaire
            </label>
            <input
              id="numeroTvaIntracom"
              name="numeroTvaIntracom"
              defaultValue={tenant.numeroTvaIntracom ?? ""}
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="regimeTva">
              Régime de TVA
            </label>
            <select
              id="regimeTva"
              name="regimeTva"
              required
              defaultValue={tenant.regimeTva}
              className={selectClass}
            >
              <option value="franchise">
                Franchise en base (art. 293 B du CGI)
              </option>
              <option value="normal">Régime normal</option>
            </select>
            <p className="mt-1 font-sans text-xs text-encre/50">
              En doute ? La plupart des auto-entrepreneurs sont en franchise en
              base (pas de TVA facturée). Votre expert-comptable confirme si besoin.
            </p>
          </div>
          <div>
            <label className={labelClass} htmlFor="capitalSocial">
              Capital social (€)
            </label>
            <input
              id="capitalSocial"
              name="capitalSocial"
              type="number"
              step="0.01"
              min="0"
              defaultValue={tenant.capitalSocial ?? ""}
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-encre/10 pt-4">
        <legend className="font-titre text-lg text-encre">Logo</legend>
        <p className="font-sans text-xs text-encre/60">
          Affiché sur vos documents PDF. PNG, JPEG, WebP ou SVG, 500 Ko maximum.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          {(apercu ?? (!supprimer ? tenant.logoDataUrl : null)) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={apercu ?? tenant.logoDataUrl ?? undefined}
              alt="Logo actuel"
              className="h-16 w-auto max-w-[160px] rounded-sm border border-encre/20 object-contain p-1"
            />
          ) : (
            <div className="flex h-16 w-40 items-center justify-center rounded-sm border border-dashed border-encre/20 font-sans text-xs text-encre/40">
              Aucun logo
            </div>
          )}
          <div className="space-y-2">
            <input
              id="logo"
              name="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(e) => {
                const fichier = e.target.files?.[0];
                if (!fichier) {
                  setApercu(null);
                  return;
                }
                setSupprimer(false);
                const reader = new FileReader();
                reader.onload = () => setApercu(reader.result as string);
                reader.readAsDataURL(fichier);
              }}
              className="block font-sans text-sm text-encre file:mr-3 file:rounded-sm file:border file:border-encre/30 file:bg-transparent file:px-3 file:py-1.5 file:font-sans file:text-sm file:text-encre hover:file:bg-encre/5"
            />
            {tenant.logoDataUrl && (
              <label className="flex items-center gap-2 font-sans text-xs text-encre/70">
                <input
                  type="checkbox"
                  name="supprimerLogo"
                  checked={supprimer}
                  onChange={(e) => {
                    setSupprimer(e.target.checked);
                    if (e.target.checked) setApercu(null);
                  }}
                />
                Supprimer le logo actuel
              </label>
            )}
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-encre/10 pt-4">
        <legend className="font-titre text-lg text-encre">Adresse</legend>

        <div>
          <label className={labelClass} htmlFor="adresseLigne1">
            Adresse
          </label>
          <input
            id="adresseLigne1"
            name="adresseLigne1"
            required
            defaultValue={tenant.adresseLigne1}
            className={inputClass}
          />
          <FieldError messages={state.fieldErrors?.adresseLigne1} />
        </div>
        <div>
          <label className={labelClass} htmlFor="adresseLigne2">
            Complément d&apos;adresse
          </label>
          <input
            id="adresseLigne2"
            name="adresseLigne2"
            defaultValue={tenant.adresseLigne2 ?? ""}
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass} htmlFor="codePostal">
              Code postal
            </label>
            <input
              id="codePostal"
              name="codePostal"
              required
              defaultValue={tenant.codePostal}
              className={inputClass}
            />
            <FieldError messages={state.fieldErrors?.codePostal} />
          </div>
          <div className="col-span-2">
            <label className={labelClass} htmlFor="ville">
              Ville
            </label>
            <input
              id="ville"
              name="ville"
              required
              defaultValue={tenant.ville}
              className={inputClass}
            />
            <FieldError messages={state.fieldErrors?.ville} />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="pays">
            Pays
          </label>
          <input
            id="pays"
            name="pays"
            required
            defaultValue={tenant.pays}
            className={inputClass}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-encre/10 pt-4">
        <legend className="font-titre text-lg text-encre">Contact</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={tenant.email ?? ""}
              className={inputClass}
            />
            <FieldError messages={state.fieldErrors?.email} />
          </div>
          <div>
            <label className={labelClass} htmlFor="telephone">
              Téléphone
            </label>
            <input
              id="telephone"
              name="telephone"
              defaultValue={tenant.telephone ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-encre/10 pt-4">
        <legend className="font-titre text-lg text-encre">
          Coordonnées bancaires
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="iban">
              IBAN
            </label>
            <input
              id="iban"
              name="iban"
              defaultValue={tenant.iban ?? ""}
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="bic">
              BIC
            </label>
            <input
              id="bic"
              name="bic"
              defaultValue={tenant.bic ?? ""}
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-encre/10 pt-4">
        <legend className="font-titre text-lg text-encre">
          Mentions légales complémentaires
        </legend>
        <textarea
          id="mentionsLegalesLibres"
          name="mentionsLegalesLibres"
          rows={3}
          defaultValue={tenant.mentionsLegalesLibres ?? ""}
          className={inputClass}
          placeholder="Assurance RC pro, agrément, etc."
        />
      </fieldset>

      <SubmitButton>Enregistrer</SubmitButton>
    </form>
  );
}
