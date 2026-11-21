import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { exigerAcces } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatEuros } from "@/lib/format";
import type { Locale } from "@/i18n/config";

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ annee?: string }>;
}) {
  const { annee } = await searchParams;
  const session = await requireSession();
  exigerAcces(session.role, "budget");
  const t = await getTranslations("app.budget");
  const locale = (await getLocale()) as Locale;

  const anneeCourante = annee ? Number(annee) : new Date().getFullYear();

  const lignes = await prisma.ligneBudget.findMany({
    where: { tenantId: session.tenantId, annee: anneeCourante },
    orderBy: { categorie: "asc" },
  });

  const recettes = lignes.filter((l) => l.type === "recette");
  const depenses = lignes.filter((l) => l.type === "depense");
  const totalRecettes = recettes.reduce((s, l) => s + Number(l.montantPrevu), 0);
  const totalDepenses = depenses.reduce((s, l) => s + Number(l.montantPrevu), 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">{t("titre")}</h1>
        <div className="flex items-center gap-2 font-sans text-sm">
          <Link
            href={`/budget?annee=${anneeCourante - 1}`}
            className="rounded-sm border border-encre/30 p-1.5 text-encre hover:bg-encre/5"
            aria-label={t("anneePrecedente")}
          >
            <ChevronLeft size={16} strokeWidth={1.75} />
          </Link>
          <span className="font-mono text-lg text-encre">{anneeCourante}</span>
          <Link
            href={`/budget?annee=${anneeCourante + 1}`}
            className="rounded-sm border border-encre/30 p-1.5 text-encre hover:bg-encre/5"
            aria-label={t("anneeSuivante")}
          >
            <ChevronRight size={16} strokeWidth={1.75} />
          </Link>
        </div>
      </div>
      <p className="mt-1 font-sans text-sm text-encre/70">{t("description")}</p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-titre text-lg text-encre">{t("recettesPrevues")}</h2>
            <Link
              href={`/budget/nouveau?annee=${anneeCourante}&type=recette`}
              className="font-sans text-sm text-encre underline"
            >
              {t("ajouterLigne")}
            </Link>
          </div>
          {recettes.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-encre/75">{t("emptyDefault")}</p>
          ) : (
            <>
              <ul className="mt-3 divide-y divide-encre/10">
                {recettes.map((ligne) => (
                  <li key={ligne.id} className="flex items-center justify-between gap-3 py-2">
                    <Link
                      href={`/budget/${ligne.id}`}
                      className="font-sans text-sm text-encre hover:underline"
                    >
                      {ligne.categorie}
                    </Link>
                    <span className="font-mono text-sm text-encre/80">
                      {formatEuros(Number(ligne.montantPrevu), locale)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 flex justify-between font-sans text-sm font-medium text-encre">
                <span>{t("total")}</span>
                <span className="font-mono">{formatEuros(totalRecettes, locale)}</span>
              </p>
            </>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-titre text-lg text-encre">{t("depensesPrevues")}</h2>
            <Link
              href={`/budget/nouveau?annee=${anneeCourante}&type=depense`}
              className="font-sans text-sm text-encre underline"
            >
              {t("ajouterLigne")}
            </Link>
          </div>
          {depenses.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-encre/75">{t("emptyDefault")}</p>
          ) : (
            <>
              <ul className="mt-3 divide-y divide-encre/10">
                {depenses.map((ligne) => (
                  <li key={ligne.id} className="flex items-center justify-between gap-3 py-2">
                    <Link
                      href={`/budget/${ligne.id}`}
                      className="font-sans text-sm text-encre hover:underline"
                    >
                      {ligne.categorie}
                    </Link>
                    <span className="font-mono text-sm text-encre/80">
                      {formatEuros(Number(ligne.montantPrevu), locale)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 flex justify-between font-sans text-sm font-medium text-encre">
                <span>{t("total")}</span>
                <span className="font-mono">{formatEuros(totalDepenses, locale)}</span>
              </p>
            </>
          )}
        </section>
      </div>

      <div className="mt-8 rounded-sm border border-encre/20 bg-white/40 p-5">
        <p className="font-sans text-sm text-encre/80">
          {t("soldePrevisionnel", { solde: formatEuros(totalRecettes - totalDepenses, locale) })}
        </p>
        <Link href="/rapport" className="mt-2 inline-block font-sans text-sm text-encre underline">
          {t("voirRapport")}
        </Link>
      </div>
    </div>
  );
}
