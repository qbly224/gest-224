"use client";

import { useActionState, useState } from "react";
import type { Client } from "@prisma/client";
import { initialActionState, type ActionState } from "@/lib/actions/types";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { inputClass, labelClass, selectClass } from "@/lib/ui";

type ClientFormAction = (
  prevState: ActionState,
  formData: FormData
) => Promise<ActionState>;

export function ClientForm({
  client,
  action,
}: {
  client?: Client;
  action: ClientFormAction;
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  const [type, setType] = useState<"particulier" | "professionnel">(
    client?.type ?? "professionnel"
  );

  return (
    <form action={formAction} className="mt-6 space-y-6">
      {state.success && (
        <p className="rounded-sm bg-encre/10 px-3 py-2 font-sans text-sm text-encre">
          Client enregistré.
        </p>
      )}
      {state.error && (
        <p className="rounded-sm bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label className={labelClass} htmlFor="type">
          Type de client
        </label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className={selectClass}
        >
          <option value="professionnel">Professionnel</option>
          <option value="particulier">Particulier</option>
        </select>
      </div>

      {type === "professionnel" ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="raisonSociale">
              Raison sociale
            </label>
            <input
              id="raisonSociale"
              name="raisonSociale"
              defaultValue={client?.raisonSociale ?? ""}
              className={inputClass}
            />
            <FieldError messages={state.fieldErrors?.raisonSociale} />
          </div>
          <div>
            <label className={labelClass} htmlFor="siret">
              SIRET
            </label>
            <input
              id="siret"
              name="siret"
              defaultValue={client?.siret ?? ""}
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass} htmlFor="civilite">
              Civilité
            </label>
            <input
              id="civilite"
              name="civilite"
              defaultValue={client?.civilite ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="prenom">
              Prénom
            </label>
            <input
              id="prenom"
              name="prenom"
              defaultValue={client?.prenom ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="nom">
              Nom
            </label>
            <input
              id="nom"
              name="nom"
              defaultValue={client?.nom ?? ""}
              className={inputClass}
            />
            <FieldError messages={state.fieldErrors?.nom} />
          </div>
        </div>
      )}

      <div>
        <label className={labelClass} htmlFor="numeroTvaIntracom">
          N° TVA intracommunautaire
        </label>
        <input
          id="numeroTvaIntracom"
          name="numeroTvaIntracom"
          defaultValue={client?.numeroTvaIntracom ?? ""}
          className={`${inputClass} font-mono`}
        />
      </div>

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
            defaultValue={client?.adresseLigne1 ?? ""}
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
            defaultValue={client?.adresseLigne2 ?? ""}
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass} htmlFor="codePostal">
              Code postal
            </label>
            <input
              id="codePostal"
              name="codePostal"
              required
              defaultValue={client?.codePostal ?? ""}
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
              defaultValue={client?.ville ?? ""}
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
            defaultValue={client?.pays ?? "France"}
            className={inputClass}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-encre/10 pt-4">
        <legend className="font-titre text-lg text-encre">Contact</legend>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={client?.email ?? ""}
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
              defaultValue={client?.telephone ?? ""}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={client?.notes ?? ""}
            className={inputClass}
          />
        </div>
      </fieldset>

      <SubmitButton>Enregistrer</SubmitButton>
    </form>
  );
}
