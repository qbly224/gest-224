import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculerRapportComplet } from "@/lib/comptabilite/agregats";
import { PLANS } from "@/lib/plans";
import { BoutonImprimer } from "@/components/rapport/bouton-imprimer";
import { formatEuros } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import type { TypeDocument } from "@prisma/client";

export default async function RapportPage() {
  const session = await requireSession();
  const t = await getTranslations("app.rapport");
  const tTypes = await getTranslations("app.typesDocument");
  const locale = (await getLocale()) as Locale;
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId } });
  const plan = PLANS[tenant.plan];

  if (!plan.rapportComplet) {
    return (
      <div>
        <h1 className="font-titre text-2xl text-encre">{t("titre")}</h1>
        <p className="mt-4 font-sans text-sm text-encre/70">{t("restreintMessage")}</p>
        <Link
          href="/abonnement"
          className="mt-4 inline-block rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
        >
          {t("voirPlans")}
        </Link>
      </div>
    );
  }

  const rapport = await calculerRapportComplet(session.tenantId, locale);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-titre text-2xl text-encre">{t("titre")}</h1>
          <p className="mt-1 font-sans text-sm text-encre/70">{tenant.raisonSociale}</p>
        </div>
        <BoutonImprimer />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
          <p
            className={`font-mono text-3xl ${rapport.soldeEtVueMensuelle.solde >= 0 ? "text-encre" : "text-red-700"}`}
          >
            {formatEuros(rapport.soldeEtVueMensuelle.solde, locale)}
          </p>
          <p className="mt-1 font-sans text-sm text-encre/70">{t("soldeGlobal")}</p>
        </div>
        <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
          <p className="font-mono text-3xl text-encre">
            {formatEuros(rapport.soldeEtVueMensuelle.totalRecettes, locale)}
          </p>
          <p className="mt-1 font-sans text-sm text-encre/70">{t("totalRecettes")}</p>
        </div>
        <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
          <p className="font-mono text-3xl text-encre">
            {formatEuros(rapport.soldeEtVueMensuelle.totalDepenses, locale)}
          </p>
          <p className="mt-1 font-sans text-sm text-encre/70">{t("totalDepenses")}</p>
        </div>
      </div>

      <div>
        <h2 className="font-titre text-lg text-encre">{t("vueMensuelle")}</h2>
        <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse font-sans text-sm">
          <thead>
            <tr className="border-b border-encre/20 text-left text-encre/60">
              <th className="py-2 font-medium">{t("colMois")}</th>
              <th className="py-2 text-right font-medium">{t("colRecettes")}</th>
              <th className="py-2 text-right font-medium">{t("colDepenses")}</th>
              <th className="py-2 text-right font-medium">{t("colSolde")}</th>
            </tr>
          </thead>
          <tbody>
            {rapport.soldeEtVueMensuelle.mois.map((m) => (
              <tr key={m.mois} className="border-b border-encre/10">
                <td className="py-2 capitalize text-encre">{m.label}</td>
                <td className="py-2 text-right font-mono text-encre/80">{formatEuros(m.recettes, locale)}</td>
                <td className="py-2 text-right font-mono text-encre/80">{formatEuros(m.depenses, locale)}</td>
                <td
                  className={`py-2 text-right font-mono ${m.solde >= 0 ? "text-encre" : "text-red-700"}`}
                >
                  {formatEuros(m.solde, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
        <div>
          <h2 className="font-titre text-lg text-encre">{t("depensesParCategorie")}</h2>
          {rapport.depensesParCategorie.length === 0 ? (
            <p className="mt-4 font-sans text-sm text-encre/60">{t("aucuneDepense")}</p>
          ) : (
            <table className="mt-4 w-full border-collapse font-sans text-sm">
              <tbody>
                {rapport.depensesParCategorie.map((d) => (
                  <tr key={d.categorie} className="border-b border-encre/10">
                    <td className="py-2 text-encre">{d.categorie}</td>
                    <td className="py-2 text-right font-mono text-encre/80">
                      {formatEuros(d.montant, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
          <h2 className="font-titre text-lg text-encre">{t("meilleursClients")}</h2>
          {rapport.topClients.length === 0 ? (
            <p className="mt-4 font-sans text-sm text-encre/60">{t("aucuneRecette")}</p>
          ) : (
            <table className="mt-4 w-full border-collapse font-sans text-sm">
              <tbody>
                {rapport.topClients.map((c) => (
                  <tr key={c.nom} className="border-b border-encre/10">
                    <td className="py-2 text-encre">{c.nom}</td>
                    <td className="py-2 text-right font-mono text-encre/80">
                      {formatEuros(c.montant, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-titre text-lg text-encre">{t("documentsParType")}</h2>
        <table className="mt-4 w-full border-collapse font-sans text-sm">
          <tbody>
            {rapport.documentsParType.map((d) => (
              <tr key={d.type} className="border-b border-encre/10">
                <td className="py-2 text-encre">{tTypes(d.type as TypeDocument)}</td>
                <td className="py-2 text-right font-mono text-encre/80">{d.nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
        <h2 className="font-titre text-lg text-encre">{t("fecTitre")}</h2>
        <p className="mt-1 max-w-2xl font-sans text-sm text-encre/70">{t("fecDescription")}</p>
        <form
          action="/api/export/fec"
          method="get"
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <div>
            <label className="mb-1 block font-sans text-xs font-medium uppercase tracking-wide text-encre/70" htmlFor="dateDebut">
              {t("fecDateDebut")}
            </label>
            <input
              id="dateDebut"
              name="dateDebut"
              type="date"
              required
              defaultValue={`${new Date().getFullYear()}-01-01`}
              className="rounded-sm border border-encre/30 bg-ivoire px-3 py-2 font-sans text-sm text-encre focus:border-encre focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block font-sans text-xs font-medium uppercase tracking-wide text-encre/70" htmlFor="dateFin">
              {t("fecDateFin")}
            </label>
            <input
              id="dateFin"
              name="dateFin"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="rounded-sm border border-encre/30 bg-ivoire px-3 py-2 font-sans text-sm text-encre focus:border-encre focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
          >
            {t("fecTelecharger")}
          </button>
        </form>
      </div>
    </div>
  );
}
