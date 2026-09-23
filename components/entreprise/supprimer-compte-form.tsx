"use client";

import { useActionState, useState } from "react";
import { supprimerCompte } from "@/lib/actions/compte";
import { initialActionState } from "@/lib/actions/types";
import { inputClass, labelClass } from "@/lib/ui";

export function SupprimerCompteForm() {
  const [state, formAction] = useActionState(supprimerCompte, initialActionState);
  const [confirme, setConfirme] = useState(false);

  return (
    <form action={formAction} className="mt-4 max-w-sm space-y-3">
      {state.error && (
        <p className="rounded-sm bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
          {state.error}
        </p>
      )}
      <label className="flex items-start gap-2 font-sans text-sm text-encre/80">
        <input
          type="checkbox"
          checked={confirme}
          onChange={(e) => setConfirme(e.target.checked)}
          className="mt-0.5"
        />
        Je comprends que cette action est définitive et supprimera immédiatement
        toute l&apos;entreprise : clients, catalogue, devis, factures, comptabilité —
        sans possibilité de récupération.
      </label>
      <div>
        <label className={labelClass} htmlFor="motDePasse">
          Confirmer avec votre mot de passe
        </label>
        <input
          id="motDePasse"
          name="motDePasse"
          type="password"
          required
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={!confirme}
        className="rounded-sm bg-red-700 px-4 py-2 font-sans text-sm font-medium text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Supprimer définitivement mon compte
      </button>
    </form>
  );
}
