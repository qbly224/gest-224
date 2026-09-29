import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("public.aPropos");
  return {
    title: t("titre"),
    description: t("p1"),
  };
}

export default async function AProposPage() {
  const t = await getTranslations("public.aPropos");

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-encre/60">
        {t("surtitre")}
      </p>
      <h1 className="mt-2 font-titre text-3xl text-encre">{t("titre")}</h1>

      <div className="mt-8 space-y-6 font-sans text-sm leading-relaxed text-encre/80">
        <p>{t("p1")}</p>
        <p>{t("p2")}</p>
        <p>{t("p3")}</p>
        <p>{t("p4")}</p>
      </div>
    </main>
  );
}
