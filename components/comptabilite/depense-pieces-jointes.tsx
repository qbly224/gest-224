"use client";

import { useActionState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { initialActionState } from "@/lib/actions/types";
import {
  ajouterPieceJointeDepense,
  supprimerPieceJointeDepense,
} from "@/lib/actions/comptabilite";
import { SubmitButton } from "@/components/forms/submit-button";
import { BoutonSupprimer } from "@/components/forms/bouton-supprimer";
import { formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/config";

type PieceJointe = {
  id: string;
  nomFichier: string;
  tailleOctets: number;
  createdAt: Date;
};

function formatTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

export function DepensePiecesJointes({
  depenseId,
  pieces,
}: {
  depenseId: string;
  pieces: PieceJointe[];
}) {
  const t = useTranslations("app.depenses");
  const locale = useLocale() as Locale;
  const [state, formAction] = useActionState(
    ajouterPieceJointeDepense.bind(null, depenseId),
    initialActionState
  );

  return (
    <div className="mt-8 border-t border-encre/10 pt-6">
      <h2 className="font-titre text-lg text-encre">{t("piecesJointesTitre")}</h2>
      <p className="mt-1 font-sans text-xs text-encre/70">{t("piecesJointesAide")}</p>

      {pieces.length === 0 ? (
        <p className="mt-4 font-sans text-sm text-encre/75">{t("piecesJointesVide")}</p>
      ) : (
        <ul className="mt-4 divide-y divide-encre/10">
          {pieces.map((piece) => (
            <li key={piece.id} className="flex items-center justify-between gap-3 py-2">
              <a
                href={`/api/depenses/pieces-jointes/${piece.id}`}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 truncate font-sans text-sm text-encre hover:underline"
              >
                {piece.nomFichier}
              </a>
              <span className="shrink-0 font-mono text-xs text-encre/70">
                {formatTaille(piece.tailleOctets)} · {formatDate(piece.createdAt, locale)}
              </span>
              <a
                href={`/api/depenses/pieces-jointes/${piece.id}?telecharger=1`}
                className="shrink-0 font-sans text-xs text-encre/75 hover:text-encre hover:underline"
              >
                {t("piecesJointesTelecharger")}
              </a>
              <form action={supprimerPieceJointeDepense.bind(null, piece.id)} className="shrink-0">
                <BoutonSupprimer confirmMessage={t("piecesJointesConfirmSuppression")} />
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="file"
          name="fichier"
          accept="application/pdf,image/png,image/jpeg,image/webp"
          required
          className="font-sans text-sm text-encre/85 file:mr-3 file:rounded-sm file:border file:border-encre/30 file:bg-transparent file:px-3 file:py-1.5 file:font-sans file:text-sm file:text-encre hover:file:bg-encre/5"
        />
        <SubmitButton>{t("piecesJointesAjouter")}</SubmitButton>
      </form>
      {state.error && (
        <p className="mt-2 rounded-sm bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
          {state.error}
        </p>
      )}
    </div>
  );
}
