import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { formatEuros } from "@/lib/format";
import { BoutonImprimer } from "@/components/rapport/bouton-imprimer";
import type { Locale } from "@/i18n/config";
import type { SessionPayload } from "@/lib/session";
import type { Tenant } from "@prisma/client";

export async function RapportAssociation({
  session,
  tenant,
  anneeInitiale,
}: {
  session: SessionPayload;
  tenant: Tenant;
  anneeInitiale: number;
}) {
  const t = await getTranslations("app.rapportAssociation");
  const locale = (await getLocale()) as Locale;
  const annee = anneeInitiale;
  const debutAnnee = new Date(Date.UTC(annee, 0, 1));
  const finAnnee = new Date(Date.UTC(annee + 1, 0, 1));

  const [
    cotisationsTotal,
    cotisationsPayeesToutes,
    cotisationsPayeesAnnee,
    donsAnnee,
    depensesAnnee,
    lignesBudget,
  ] = await Promise.all([
    prisma.cotisation.aggregate({
      where: { tenantId: session.tenantId },
      _sum: { montant: true },
      _count: true,
    }),
    prisma.cotisation.aggregate({
      where: { tenantId: session.tenantId, datePaiement: { not: null } },
      _sum: { montant: true },
      _count: true,
    }),
    prisma.cotisation.aggregate({
      where: {
        tenantId: session.tenantId,
        datePaiement: { gte: debutAnnee, lt: finAnnee },
      },
      _sum: { montant: true },
    }),
    prisma.don.aggregate({
      where: { tenantId: session.tenantId, date: { gte: debutAnnee, lt: finAnnee } },
      _sum: { montant: true },
    }),
    prisma.depense.aggregate({
      where: { tenantId: session.tenantId, date: { gte: debutAnnee, lt: finAnnee } },
      _sum: { montant: true },
    }),
    prisma.ligneBudget.findMany({
      where: { tenantId: session.tenantId, annee },
    }),
  ]);

  const totalCotisationsDues = Number(cotisationsTotal._sum.montant ?? 0);
  const totalCotisationsEncaissees = Number(cotisationsPayeesToutes._sum.montant ?? 0);
  const totalCotisationsImpayees = totalCotisationsDues - totalCotisationsEncaissees;
  const nbCotisationsImpayees = cotisationsTotal._count - cotisationsPayeesToutes._count;

  const cotisationsEncaisseesAnnee = Number(cotisationsPayeesAnnee._sum.montant ?? 0);
  const totalDons = Number(donsAnnee._sum.montant ?? 0);
  const totalDepenses = Number(depensesAnnee._sum.montant ?? 0);
  const totalRecettesAnnee = cotisationsEncaisseesAnnee + totalDons;
  const soldeAnnee = totalRecettesAnnee - totalDepenses;

  const budgetRecettesPrevu = lignesBudget
    .filter((l) => l.type === "recette")
    .reduce((s, l) => s + Number(l.montantPrevu), 0);
  const budgetDepensesPrevu = lignesBudget
    .filter((l) => l.type === "depense")
    .reduce((s, l) => s + Number(l.montantPrevu), 0);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-titre text-2xl text-encre">{t("titre")}</h1>
          <p className="mt-1 font-sans text-sm text-encre/70">{tenant.raisonSociale}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-sans text-sm">
            <Link
              href={`/rapport?annee=${annee - 1}`}
              className="rounded-sm border border-encre/30 p-1.5 text-encre hover:bg-encre/5"
              aria-label={t("anneePrecedente")}
            >
              <ChevronLeft size={16} strokeWidth={1.75} />
            </Link>
            <span className="font-mono text-lg text-encre">{annee}</span>
            <Link
              href={`/rapport?annee=${annee + 1}`}
              className="rounded-sm border border-encre/30 p-1.5 text-encre hover:bg-encre/5"
              aria-label={t("anneeSuivante")}
            >
              <ChevronRight size={16} strokeWidth={1.75} />
            </Link>
          </div>
          <BoutonImprimer />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
          <p className={`font-mono text-3xl ${soldeAnnee >= 0 ? "text-encre" : "text-red-700"}`}>
            {formatEuros(soldeAnnee, locale)}
          </p>
          <p className="mt-1 font-sans text-sm text-encre/70">{t("soldeAnnee")}</p>
        </div>
        <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
          <p className="font-mono text-3xl text-encre">{formatEuros(totalRecettesAnnee, locale)}</p>
          <p className="mt-1 font-sans text-sm text-encre/70">{t("recettesAnnee")}</p>
        </div>
        <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
          <p className="font-mono text-3xl text-encre">{formatEuros(totalDepenses, locale)}</p>
          <p className="mt-1 font-sans text-sm text-encre/70">{t("depensesAnnee")}</p>
        </div>
      </div>

      <div>
        <h2 className="font-titre text-lg text-encre">{t("cotisationsTitre")}</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-sm border border-encre/20 bg-white/40 p-5">
            <p className="font-mono text-xl text-encre">{formatEuros(totalCotisationsDues, locale)}</p>
            <p className="mt-1 font-sans text-xs text-encre/70">{t("totalDues")}</p>
          </div>
          <div className="rounded-sm border border-encre/20 bg-white/40 p-5">
            <p className="font-mono text-xl text-encre">
              {formatEuros(totalCotisationsEncaissees, locale)}
            </p>
            <p className="mt-1 font-sans text-xs text-encre/70">{t("totalEncaissees")}</p>
          </div>
          <div className="rounded-sm border border-encre/20 bg-white/40 p-5">
            <p className="font-mono text-xl text-red-700">
              {formatEuros(totalCotisationsImpayees, locale)}
            </p>
            <p className="mt-1 font-sans text-xs text-encre/70">
              {t("totalImpayees", { nombre: nbCotisationsImpayees })}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-titre text-lg text-encre">{t("donsTitre")}</h2>
        <p className="mt-2 font-mono text-xl text-encre">{formatEuros(totalDons, locale)}</p>
        <Link href="/dons" className="mt-1 inline-block font-sans text-sm text-encre underline">
          {t("voirDons")}
        </Link>
      </div>

      <div>
        <h2 className="font-titre text-lg text-encre">{t("budgetTitre")}</h2>
        {lignesBudget.length === 0 ? (
          <p className="mt-2 font-sans text-sm text-encre/75">{t("budgetVide")}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse font-sans text-sm">
              <thead>
                <tr className="border-b border-encre/20 text-left text-encre/75">
                  <th className="py-2 font-medium" />
                  <th className="py-2 text-right font-medium">{t("colPrevu")}</th>
                  <th className="py-2 text-right font-medium">{t("colRealise")}</th>
                  <th className="py-2 text-right font-medium">{t("colEcart")}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-encre/10">
                  <td className="py-2 text-encre">{t("recettes")}</td>
                  <td className="py-2 text-right font-mono text-encre/80">
                    {formatEuros(budgetRecettesPrevu, locale)}
                  </td>
                  <td className="py-2 text-right font-mono text-encre/80">
                    {formatEuros(totalRecettesAnnee, locale)}
                  </td>
                  <td
                    className={`py-2 text-right font-mono ${
                      totalRecettesAnnee - budgetRecettesPrevu >= 0 ? "text-encre" : "text-red-700"
                    }`}
                  >
                    {formatEuros(totalRecettesAnnee - budgetRecettesPrevu, locale)}
                  </td>
                </tr>
                <tr className="border-b border-encre/10">
                  <td className="py-2 text-encre">{t("depenses")}</td>
                  <td className="py-2 text-right font-mono text-encre/80">
                    {formatEuros(budgetDepensesPrevu, locale)}
                  </td>
                  <td className="py-2 text-right font-mono text-encre/80">
                    {formatEuros(totalDepenses, locale)}
                  </td>
                  <td
                    className={`py-2 text-right font-mono ${
                      budgetDepensesPrevu - totalDepenses >= 0 ? "text-encre" : "text-red-700"
                    }`}
                  >
                    {formatEuros(budgetDepensesPrevu - totalDepenses, locale)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <Link href="/budget" className="mt-3 inline-block font-sans text-sm text-encre underline">
          {t("voirBudget")}
        </Link>
      </div>
    </div>
  );
}
