"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import type { TypeCompte } from "@prisma/client";
import { changerRoleMembreEquipe } from "@/lib/actions/equipe";
import { selectClass } from "@/lib/ui";

const ROLES_PAR_TYPE: Record<TypeCompte, { value: string; cle: string }[]> = {
  entreprise: [{ value: "membre", cle: "membre" }],
  association: [
    { value: "tresorier", cle: "tresorier" },
    { value: "communication", cle: "communication" },
    { value: "secretaire", cle: "secretaire" },
  ],
};

export function RoleSelect({
  userId,
  roleActuel,
  typeCompte,
}: {
  userId: string;
  roleActuel: string;
  typeCompte: TypeCompte;
}) {
  const t = useTranslations("app.equipe");
  const formRef = useRef<HTMLFormElement>(null);
  const action = changerRoleMembreEquipe.bind(null, userId);

  return (
    <form ref={formRef} action={action}>
      <select
        name="role"
        defaultValue={roleActuel}
        onChange={() => formRef.current?.requestSubmit()}
        className={`${selectClass} py-1 text-xs`}
      >
        {ROLES_PAR_TYPE[typeCompte].map((r) => (
          <option key={r.value} value={r.value}>
            {t(`roles.${r.cle}`)}
          </option>
        ))}
      </select>
    </form>
  );
}
