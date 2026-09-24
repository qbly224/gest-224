import { STATUT_LABELS } from "@/lib/documents/statut-labels";
import type { StatutDocument } from "@prisma/client";

export function DocumentFiltres({
  q,
  statut,
  statutsDisponibles,
}: {
  q?: string;
  statut?: string;
  statutsDisponibles: StatutDocument[];
}) {
  return (
    <form className="mt-4 flex flex-wrap items-center gap-2" method="get">
      <input
        type="search"
        name="q"
        defaultValue={q ?? ""}
        placeholder="Rechercher un numéro ou un client…"
        className="w-full max-w-xs rounded-sm border border-encre/30 bg-ivoire px-3 py-2 font-sans text-sm text-encre placeholder:text-encre/40 focus:border-encre focus:outline-none"
      />
      <select
        name="statut"
        defaultValue={statut ?? ""}
        className="rounded-sm border border-encre/30 bg-ivoire px-3 py-2 font-sans text-sm text-encre focus:border-encre focus:outline-none"
      >
        <option value="">Tous les statuts</option>
        {statutsDisponibles.map((s) => (
          <option key={s} value={s}>
            {STATUT_LABELS[s]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
      >
        Filtrer
      </button>
      {(q || statut) && (
        <a href="?" className="font-sans text-xs text-encre/60 underline">
          Réinitialiser
        </a>
      )}
    </form>
  );
}
