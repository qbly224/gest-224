import { STATUT_LABELS } from "@/lib/documents/statut-labels";
import type { StatutDocument } from "@prisma/client";

export function DocumentFiltres({
  q,
  statut,
  depuis,
  jusqua,
  statutsDisponibles,
}: {
  q?: string;
  statut?: string;
  depuis?: string;
  jusqua?: string;
  statutsDisponibles: StatutDocument[];
}) {
  return (
    <form className="mt-4 flex flex-wrap items-end gap-2" method="get">
      <div>
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Rechercher un numéro ou un client…"
          className="w-full max-w-xs rounded-sm border border-encre/30 bg-ivoire px-3 py-2 font-sans text-sm text-encre placeholder:text-encre/40 focus:border-encre focus:outline-none"
        />
      </div>
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
      <div className="flex items-center gap-1">
        <label className="font-sans text-xs text-encre/60" htmlFor="depuis">
          Du
        </label>
        <input
          id="depuis"
          type="date"
          name="depuis"
          defaultValue={depuis ?? ""}
          className="rounded-sm border border-encre/30 bg-ivoire px-2 py-2 font-mono text-sm text-encre focus:border-encre focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-1">
        <label className="font-sans text-xs text-encre/60" htmlFor="jusqua">
          au
        </label>
        <input
          id="jusqua"
          type="date"
          name="jusqua"
          defaultValue={jusqua ?? ""}
          className="rounded-sm border border-encre/30 bg-ivoire px-2 py-2 font-mono text-sm text-encre focus:border-encre focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
      >
        Filtrer
      </button>
      {(q || statut || depuis || jusqua) && (
        <a href="?" className="font-sans text-xs text-encre/60 underline">
          Réinitialiser
        </a>
      )}
    </form>
  );
}
