import { getTranslations, getLocale } from "next-intl/server";
import { formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/config";

export async function LegalPage({
  titre,
  misAJour,
  children,
}: {
  titre: string;
  misAJour: Date;
  children: React.ReactNode;
}) {
  const t = await getTranslations("public.legal");
  const locale = (await getLocale()) as Locale;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-titre text-3xl text-encre">{titre}</h1>
      <p className="mt-2 font-mono text-xs text-encre/50">
        {t("misAJourLabel")} {formatDate(misAJour, locale, { day: "numeric", month: "long", year: "numeric" })}
      </p>
      <p className="mt-4 rounded-sm bg-encre/5 px-3 py-2 font-sans text-xs text-encre/60">
        {t("avisTraduction")}
      </p>
      <div className="prose-legal mt-8 space-y-6 font-sans text-sm leading-relaxed text-encre/80">
        {children}
      </div>
    </main>
  );
}

export function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-titre text-lg text-encre">{titre}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}
