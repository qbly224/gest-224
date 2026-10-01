import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changerStatutChantier, supprimerChantier } from "@/lib/actions/chantiers";
import { BoutonSupprimer } from "@/components/forms/bouton-supprimer";
import { formatEuros, formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import type { Prisma, StatutChantier } from "@prisma/client";

export default async function ChantiersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; statut?: string }>;
}) {
  const { q, statut } = await searchParams;
  const session = await requireSession();
  const t = await getTranslations("app.chantiers");
  const locale = (await getLocale()) as Locale;
  const terme = q?.trim();

  const where: Prisma.ChantierWhereInput = {
    tenantId: session.tenantId,
    ...(statut ? { statut: statut as StatutChantier } : {}),
    ...(terme
      ? {
          OR: [
            { titre: { contains: terme, mode: "insensitive" } },
            { client: { raisonSociale: { contains: terme, mode: "insensitive" } } },
            { client: { nom: { contains: terme, mode: "insensitive" } } },
            { client: { prenom: { contains: terme, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const chantiers = await prisma.chantier.findMany({
    where,
    include: { client: true },
    orderBy: [{ dateEcheance: "asc" }, { createdAt: "desc" }],
  });

  const STATUT_LABEL: Record<StatutChantier, string> = {
    a_faire: t("aFaire"),
    en_cours: t("enCours"),
    fait: t("fait"),
    annule: t("annule"),
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">{t("titre")}</h1>
        <Link
          href="/chantiers/nouveau"
          className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
        >
          {t("nouveauBouton")}
        </Link>
      </div>

      <form className="mt-4 flex flex-wrap items-center gap-2" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder={t("rechercherPlaceholder")}
          className="w-full max-w-xs rounded-sm border border-encre/30 bg-ivoire px-3 py-2 font-sans text-sm text-encre placeholder:text-encre/70 focus:border-encre focus:outline-none"
        />
        <select
          name="statut"
          aria-label={t("colStatut")}
          defaultValue={statut ?? ""}
          className="rounded-sm border border-encre/30 bg-ivoire px-3 py-2 font-sans text-sm text-encre focus:border-encre focus:outline-none"
        >
          <option value="">{t("tous")}</option>
          <option value="a_faire">{t("aFaire")}</option>
          <option value="en_cours">{t("enCours")}</option>
          <option value="fait">{t("fait")}</option>
          <option value="annule">{t("annule")}</option>
        </select>
        <button
          type="submit"
          className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
        >
          {t("filtrer")}
        </button>
        {(q || statut) && (
          <a href="?" className="font-sans text-xs text-encre/75 underline">
            {t("reinitialiser")}
          </a>
        )}
      </form>

      {chantiers.length === 0 ? (
        <p className="mt-8 font-sans text-sm text-encre/75">
          {q || statut ? t("emptyFiltre") : t("emptyDefault")}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse font-sans text-sm">
          <thead>
            <tr className="border-b border-encre/20 text-left text-encre/75">
              <th className="py-2 font-medium">{t("colTitre")}</th>
              <th className="py-2 font-medium">{t("colClient")}</th>
              <th className="py-2 font-medium">{t("colDateDebut")}</th>
              <th className="py-2 font-medium">{t("colDateEcheance")}</th>
              <th className="py-2 text-right font-medium">{t("colMontant")}</th>
              <th className="py-2 font-medium">{t("colStatut")}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {chantiers.map((c) => (
              <tr key={c.id} className="border-b border-encre/10 align-middle">
                <td className="py-3">
                  <Link href={`/chantiers/${c.id}`} className="text-encre hover:underline">
                    {c.titre}
                  </Link>
                </td>
                <td className="py-3 text-encre/70">
                  {c.client
                    ? c.client.type === "professionnel"
                      ? c.client.raisonSociale
                      : `${c.client.prenom ?? ""} ${c.client.nom ?? ""}`.trim()
                    : "—"}
                </td>
                <td className="py-3 font-mono text-xs text-encre/70">
                  {c.dateDebut ? formatDate(c.dateDebut, locale) : "—"}
                </td>
                <td className="py-3 font-mono text-xs text-encre/70">
                  {c.dateEcheance ? formatDate(c.dateEcheance, locale) : "—"}
                </td>
                <td className="py-3 text-right font-mono text-encre/80">
                  {c.montant ? formatEuros(Number(c.montant), locale) : "—"}
                </td>
                <td className="py-3">
                  <form
                    action={changerStatutChantier.bind(null, c.id)}
                    className="flex items-center gap-1"
                  >
                    <select
                      name="statut"
                      aria-label={`${t("colStatut")} — ${c.titre}`}
                      defaultValue={c.statut}
                      className="rounded-sm border border-encre/30 bg-transparent px-1 py-0.5 font-sans text-xs text-encre"
                    >
                      {(Object.keys(STATUT_LABEL) as StatutChantier[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUT_LABEL[s]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-sm border border-encre/30 px-2 py-0.5 font-sans text-xs text-encre hover:bg-encre/5"
                    >
                      {t("ok")}
                    </button>
                  </form>
                </td>
                <td className="py-3 text-right">
                  <form action={supprimerChantier.bind(null, c.id)}>
                    <BoutonSupprimer
                      confirmMessage={t("confirmSuppression", { titre: c.titre })}
                    />
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
