import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { LISTE_PLANS } from "@/lib/plans";
import { DecorHero } from "@/components/public/decor-hero";
import { MockupFacture } from "@/components/public/mockup-facture";
import { TrustBadges } from "@/components/public/trust-badges";
import { CompteurAnime } from "@/components/public/compteur-anime";
import { Reveal } from "@/components/public/reveal";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("public.accueil");
  return {
    title: `${t("titre")} ${t("titreSuite")}`,
    description: t("description"),
  };
}

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
  const nbDocuments = await prisma.document.count();

  return (
    <main>
      <section className="relative overflow-hidden">
        <DecorHero />
        <div className="relative mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 px-6 pb-16 pt-20 lg:grid-cols-2 lg:gap-8 lg:pb-24 lg:pt-28">
          <div className="text-center lg:text-left">
            <p className="font-mono text-xs uppercase tracking-widest text-encre/60">
              {t("surtitre")}
            </p>
            <h1 className="mt-4 font-titre text-4xl text-encre sm:text-5xl">
              {t("titre")}
              <br className="hidden sm:block" /> {t("titreSuite")}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl font-sans text-base text-encre/70 lg:mx-0">
              {t("description")}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <Link
                href="/inscription"
                className="rounded-sm bg-encre px-6 py-3 font-sans text-sm font-medium text-ivoire transition-transform hover:-translate-y-0.5 hover:bg-encre-light"
              >
                {t("creerCompteGratuit")}
              </Link>
              <Link
                href="/tarifs"
                className="rounded-sm border border-encre/30 px-6 py-3 font-sans text-sm text-encre transition-colors hover:bg-encre/5"
              >
                {t("voirTarifs")}
              </Link>
            </div>
            <p className="mt-4 font-sans text-xs text-encre/50">{t("aucuneCarteBancaire")}</p>
          </div>

          <Reveal className="hidden lg:block" delayMs={150}>
            <MockupFacture />
          </Reveal>
        </div>

        <div className="relative border-t border-encre/10 px-6 py-6">
          <TrustBadges />
        </div>
      </section>

      <section className="border-t border-encre/10 bg-surface/60 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal className="text-center">
            <h2 className="font-titre text-2xl text-encre">{t("fonctionnalitesTitre")}</h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {CLES_FONCTIONNALITES.map((cle, i) => (
              <Reveal key={cle} delayMs={i * 80}>
                <div className="h-full rounded-sm p-5 transition-all duration-300 hover:-translate-y-1 hover:bg-surface hover:shadow-xl hover:shadow-encre/10">
                  <h3 className="font-titre text-lg text-encre">
                    {t(`fonctionnalites.${cle}.titre`)}
                  </h3>
                  <p className="mt-2 font-sans text-sm text-encre/70">
                    {t(`fonctionnalites.${cle}.description`)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <Reveal>
            <p className="font-mono text-4xl text-encre">
              <CompteurAnime valeur={nbDocuments} suffixe="+" />
            </p>
            <p className="mt-2 font-sans text-sm text-encre/60">{t("statDocuments")}</p>
          </Reveal>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Reveal>
            <h2 className="font-titre text-2xl text-encre">{t("tarifsTitre")}</h2>
            <p className="mt-2 font-sans text-sm text-encre/70">{t("tarifsDescription")}</p>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {LISTE_PLANS.map((plan, i) => (
              <Reveal key={plan.id} delayMs={i * 100}>
                <div className="flex h-full flex-col rounded-sm border border-encre/20 bg-surface/70 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-encre/40 hover:shadow-xl hover:shadow-encre/10">
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
              </Reveal>
            ))}
          </div>
          <Link href="/tarifs" className="mt-6 inline-block font-sans text-sm text-encre underline">
            {t("comparerPlans")}
          </Link>
        </div>
      </section>

      <section className="border-t border-encre/10 bg-encre py-16">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <Reveal>
            <h2 className="font-titre text-2xl text-ivoire">{t("ctaTitre")}</h2>
            <p className="mt-2 font-sans text-sm text-ivoire/70">{t("ctaDescription")}</p>
            <Link
              href="/inscription"
              className="mt-6 inline-block rounded-sm bg-ivoire px-6 py-3 font-sans text-sm font-medium text-encre transition-transform hover:-translate-y-0.5 hover:bg-ivoire/90"
            >
              {t("creerCompte")}
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
