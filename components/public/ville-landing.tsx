import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/public/reveal";

const CLES_AVANTAGES = ["devisFactures", "comptabilite", "conformite"] as const;
const CLES_FAQ = ["q1", "q2", "q3"] as const;

export async function VilleLanding({ namespace }: { namespace: string }) {
  const t = await getTranslations(namespace);
  const tAccueil = await getTranslations("public.accueil");

  return (
    <main>
      <section className="border-b border-encre/10 bg-surface/60 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-encre/75">
            {t("surtitre")}
          </p>
          <h1 className="mt-4 font-titre text-3xl text-encre sm:text-4xl">{t("titre")}</h1>
          <p className="mx-auto mt-5 max-w-2xl font-sans text-sm leading-relaxed text-encre/80">
            {t("intro")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/inscription"
              className="rounded-sm bg-encre px-6 py-3 font-sans text-sm font-medium text-ivoire transition-transform hover:-translate-y-0.5 hover:bg-encre/90"
            >
              {t("ctaBouton")}
            </Link>
            <Link
              href="/tarifs"
              className="rounded-sm border border-encre/30 px-6 py-3 font-sans text-sm text-encre transition-colors hover:bg-encre/5"
            >
              {tAccueil("voirTarifs")}
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl space-y-6 font-sans text-sm leading-relaxed text-encre/80">
          <p>{t("p1")}</p>
          <p>{t("p2")}</p>
          <p>{t("p3")}</p>
        </div>
      </section>

      <section className="border-t border-encre/10 bg-surface/60 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal className="text-center">
            <h2 className="font-titre text-2xl text-encre">{t("avantagesTitre")}</h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {CLES_AVANTAGES.map((cle, i) => (
              <Reveal key={cle} delayMs={i * 80}>
                <div className="h-full rounded-sm p-5 transition-all duration-300 hover:-translate-y-1 hover:bg-surface hover:shadow-xl hover:shadow-encre/10">
                  <h3 className="font-titre text-lg text-encre">
                    {t(`avantages.${cle}.titre`)}
                  </h3>
                  <p className="mt-2 font-sans text-sm text-encre/70">
                    {t(`avantages.${cle}.description`)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <Reveal className="text-center">
            <h2 className="font-titre text-2xl text-encre">{t("faqTitre")}</h2>
          </Reveal>
          <div className="mt-8 space-y-6">
            {CLES_FAQ.map((cle, i) => (
              <Reveal key={cle} delayMs={i * 80}>
                <div>
                  <h3 className="font-titre text-base text-encre">
                    {t(`faq.${cle}.question`)}
                  </h3>
                  <p className="mt-2 font-sans text-sm text-encre/70">
                    {t(`faq.${cle}.reponse`)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
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
              {t("ctaBouton")}
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
