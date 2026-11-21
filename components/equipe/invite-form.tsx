"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { TypeCompte } from "@prisma/client";
import { initialActionState, type ActionState } from "@/lib/actions/types";
import { inviterMembreEquipe } from "@/lib/actions/equipe";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { inputClass, labelClass, selectClass } from "@/lib/ui";

const ROLES_PAR_TYPE: Record<TypeCompte, { value: string; cle: string }[]> = {
  entreprise: [{ value: "membre", cle: "membre" }],
  association: [
    { value: "tresorier", cle: "tresorier" },
    { value: "communication", cle: "communication" },
    { value: "secretaire", cle: "secretaire" },
  ],
};

export function InviteForm({ typeCompte }: { typeCompte: TypeCompte }) {
  const t = useTranslations("app.equipe");
  const [state, formAction] = useActionState<ActionState, FormData>(
    inviterMembreEquipe,
    initialActionState
  );
  const roles = ROLES_PAR_TYPE[typeCompte];

  return (
    <form action={formAction} className="space-y-4 rounded-sm border border-encre/15 bg-white/50 p-4">
      <h2 className="font-titre text-base text-encre">{t("inviter")}</h2>

      {state.error && (
        <p className="rounded-sm bg-red-50 px-3 py-2 font-sans text-sm text-red-700">{state.error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="prenom">
            {t("prenom")}
          </label>
          <input id="prenom" name="prenom" required className={inputClass} />
          <FieldError messages={state.fieldErrors?.prenom} />
        </div>
        <div>
          <label className={labelClass} htmlFor="nom">
            {t("nom")}
          </label>
          <input id="nom" name="nom" required className={inputClass} />
          <FieldError messages={state.fieldErrors?.nom} />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="email">
          {t("email")}
        </label>
        <input id="email" name="email" type="email" required className={inputClass} />
        <FieldError messages={state.fieldErrors?.email} />
      </div>

      <div>
        <label className={labelClass} htmlFor="role">
          {t("role")}
        </label>
        <select id="role" name="role" required defaultValue="" className={selectClass}>
          <option value="" disabled>
            {t("choisirRole")}
          </option>
          {roles.map((r) => (
            <option key={r.value} value={r.value}>
              {t(`roles.${r.cle}`)}
            </option>
          ))}
        </select>
        <FieldError messages={state.fieldErrors?.role} />
      </div>

      <SubmitButton>{t("envoyerInvitation")}</SubmitButton>
    </form>
  );
}
