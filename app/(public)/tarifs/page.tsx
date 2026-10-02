import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LISTE_PLANS } from "@/lib/plans";
import { Reveal } from "@/components/public/reveal";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("public.tarifs");
  return {
    title: t("titre"),
    description: t("metaDescription"),
  };
}

export default async function TarifsPage() {
  const t = await getTranslations("public.tarifs");
  const tPlans = await getTranslations("plans");

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-encre/75">
            {t("surtitre")}
          </p>
          <h1 className="mt-2 font-titre text-3xl text-encre">{t("titre")}</h1>
          <p className="mt-3 font-sans text-sm text-encre/70">
            {t("dejaInscrit")}{" "}
            <Link href="/connexion" className="underline">
              {t("seConnecter")}
            </Link>
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {LISTE_PLANS.map((plan, i) => (
            <Reveal key={plan.id} delayMs={i * 100}>
              <div className="flex h-full flex-col rounded-sm border border-encre/20 bg-surface/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-encre/40 hover:shadow-xl hover:shadow-encre/10">
                <h2 className="font-titre text-xl text-encre">{tPlans(`${plan.id}.label`)}</h2>
                <p className="mt-2 font-mono text-3xl text-encre">
                  {plan.prixMensuel === 0 ? "0 €" : `${plan.prixMensuel} €`}
                  <span className="font-sans text-sm text-encre/75"> {t("parMois")}</span>
                </p>

                <ul className="mt-6 flex-1 space-y-2 font-sans text-sm text-encre/80">
                  {tPlans.raw(`${plan.id}.fonctionnalites`).map((f: string) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-encre/70">-</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/inscription?plan=${plan.id}`}
                  className="mt-6 rounded-sm bg-encre px-4 py-2 text-center font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
                >
                  {t("choisir", { plan: tPlans(`${plan.id}.label`) })}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-10 text-center font-sans text-xs text-encre/70">
          {t("changementLibre")}
        </p>
      </div>
    </main>
  );
}
