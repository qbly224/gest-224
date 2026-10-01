import { getTranslations } from "next-intl/server";
import type { StatutDocument } from "@prisma/client";

export async function DocumentFiltres({
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
  const t = await getTranslations("app.documentFiltres");
  const tStatuts = await getTranslations("app.statuts");

  return (
    <form className="mt-4 flex flex-wrap items-end gap-2" method="get">
      <div>
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder={t("rechercherPlaceholder")}
          className="w-full max-w-xs rounded-sm border border-encre/30 bg-ivoire px-3 py-2 font-sans text-sm text-encre placeholder:text-encre/70 focus:border-encre focus:outline-none"
        />
      </div>
      <select
        name="statut"
        aria-label={t("filtrerParStatutAria")}
        defaultValue={statut ?? ""}
        className="rounded-sm border border-encre/30 bg-ivoire px-3 py-2 font-sans text-sm text-encre focus:border-encre focus:outline-none"
      >
        <option value="">{t("tousLesStatuts")}</option>
        {statutsDisponibles.map((s) => (
          <option key={s} value={s}>
            {tStatuts(s)}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-1">
        <label className="font-sans text-xs text-encre/75" htmlFor="depuis">
          {t("du")}
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
        <label className="font-sans text-xs text-encre/75" htmlFor="jusqua">
          {t("au")}
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
        {t("filtrer")}
      </button>
      {(q || statut || depuis || jusqua) && (
        <a href="?" className="font-sans text-xs text-encre/75 underline">
          {t("reinitialiser")}
        </a>
      )}
    </form>
  );
}
