import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/session";
import { LISTE_PLANS } from "@/lib/plans";

const CLES_FONCTIONNALITES = [
  "devisFactures",
  "chaine",
  "comptabilite",
  "franchise",
  "envoi",
  "multiEntreprise",
] as const;

export default async function AccueilPage() {
  const session = await getSession();
  if (session) {
    redirect("/tableau-de-bord");
  }

  const t = await getTranslations("public.accueil");
  const tPlans = await getTranslations("plans");

  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-20 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-encre/60">
          {t("surtitre")}
        </p>
        <h1 className="mt-4 font-titre text-4xl text-encre sm:text-5xl">
          {t("titre")}
          <br className="hidden sm:block" /> {t("titreSuite")}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl font-sans text-base text-encre/70">
          {t("description")}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/inscription"
            className="rounded-sm bg-encre px-6 py-3 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
          >
            {t("creerCompteGratuit")}
          </Link>
          <Link
            href="/tarifs"
            className="rounded-sm border border-encre/30 px-6 py-3 font-sans text-sm text-encre hover:bg-encre/5"
          >
            {t("voirTarifs")}
          </Link>
        </div>
        <p className="mt-4 font-sans text-xs text-encre/50">{t("aucuneCarteBancaire")}</p>
      </section>

      <section className="border-t border-encre/10 bg-white/40 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center font-titre text-2xl text-encre">
            {t("fonctionnalitesTitre")}
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {CLES_FONCTIONNALITES.map((cle) => (
              <div key={cle}>
                <h3 className="font-titre text-lg text-encre">
                  {t(`fonctionnalites.${cle}.titre`)}
                </h3>
                <p className="mt-2 font-sans text-sm text-encre/70">
                  {t(`fonctionnalites.${cle}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-titre text-2xl text-encre">{t("tarifsTitre")}</h2>
          <p className="mt-2 font-sans text-sm text-encre/70">{t("tarifsDescription")}</p>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {LISTE_PLANS.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-col rounded-sm border border-encre/20 bg-white/40 p-6 text-left"
              >
                <h3 className="font-titre text-xl text-encre">{tPlans(`${plan.id}.label`)}</h3>
                <p className="mt-2 font-mono text-2xl text-encre">
                  {plan.prixMensuel === 0 ? "0 €" : `${plan.prixMensuel} €`}
                  <span className="font-sans text-sm text-encre/60"> / mois</span>
                </p>
                <Link
                  href={`/inscription?plan=${plan.id}`}
                  className="mt-4 rounded-sm border border-encre/30 px-4 py-2 text-center font-sans text-sm text-encre hover:bg-encre/5"
                >
                  {t("choisir", { plan: tPlans(`${plan.id}.label`) })}
                </Link>
              </div>
            ))}
          </div>
          <Link href="/tarifs" className="mt-6 inline-block font-sans text-sm text-encre underline">
            {t("comparerPlans")}
          </Link>
        </div>
      </section>

      <section className="border-t border-encre/10 bg-encre py-16">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-titre text-2xl text-ivoire">{t("ctaTitre")}</h2>
          <p className="mt-2 font-sans text-sm text-ivoire/70">{t("ctaDescription")}</p>
          <Link
            href="/inscription"
            className="mt-6 inline-block rounded-sm bg-ivoire px-6 py-3 font-sans text-sm font-medium text-encre hover:bg-ivoire/90"
          >
            {t("creerCompte")}
          </Link>
        </div>
      </section>
    </main>
  );
}
