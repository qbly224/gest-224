import Link from "next/link";
import { Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { exigerAcces } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { toggleMembreActif } from "@/lib/actions/membres";
import type { Prisma } from "@prisma/client";

export default async function MembresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; statut?: string }>;
}) {
  const { q, statut } = await searchParams;
  const session = await requireSession();
  exigerAcces(session.role, "membres");
  const t = await getTranslations("app.membres");
  const terme = q?.trim();

  const where: Prisma.MembreWhereInput = {
    tenantId: session.tenantId,
    ...(statut === "actifs" ? { actif: true } : statut === "desactives" ? { actif: false } : {}),
    ...(terme
      ? {
          OR: [
            { nom: { contains: terme, mode: "insensitive" } },
            { prenom: { contains: terme, mode: "insensitive" } },
            { email: { contains: terme, mode: "insensitive" } },
            { ville: { contains: terme, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const membres = await prisma.membre.findMany({
    where,
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">{t("titre")}</h1>
        <Link
          href="/membres/nouveau"
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
          <option value="actifs">{t("actifs")}</option>
          <option value="desactives">{t("desactives")}</option>
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

      {membres.length === 0 ? (
        <p className="mt-8 font-sans text-sm text-encre/75">
          {q || statut ? t("emptyFiltre") : t("emptyDefault")}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-encre/20 text-left text-encre/75">
                <th className="py-2 font-medium">{t("colNom")}</th>
                <th className="py-2 font-medium">{t("colRole")}</th>
                <th className="py-2 font-medium">{t("colEmail")}</th>
                <th className="py-2 font-medium">{t("colTelephone")}</th>
                <th className="py-2 font-medium">{t("colStatut")}</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {membres.map((membre) => (
                <tr key={membre.id} className="border-b border-encre/10">
                  <td className="py-3">
                    <Link
                      href={`/membres/${membre.id}`}
                      className="text-encre hover:underline"
                    >
                      {membre.civilite ? `${membre.civilite} ` : ""}
                      {membre.prenom} {membre.nom}
                    </Link>
                  </td>
                  <td className="py-3 text-encre/70">{t(`role${capitalize(membre.role)}`)}</td>
                  <td className="py-3 text-encre/70">{membre.email ?? "-"}</td>
                  <td className="py-3 text-encre/70">
                    {membre.telephone ? (
                      <a
                        href={`tel:${membre.telephone}`}
                        className="inline-flex items-center gap-1 hover:text-encre hover:underline"
                      >
                        <Phone size={14} strokeWidth={1.75} />
                        {membre.telephone}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-3">
                    <span
                      className={
                        membre.actif
                          ? "font-mono text-xs text-encre"
                          : "font-mono text-xs text-encre/70"
                      }
                    >
                      {membre.actif ? t("actif") : t("desactive")}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <form action={toggleMembreActif.bind(null, membre.id)}>
                      <button
                        type="submit"
                        className="font-sans text-xs text-encre/75 hover:text-encre hover:underline"
                      >
                        {membre.actif ? t("desactiver") : t("reactiver")}
                      </button>
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

function capitalize(role: string): string {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}
