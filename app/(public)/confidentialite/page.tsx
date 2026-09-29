import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage, Section } from "@/components/public/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const [t, tLegal] = await Promise.all([
    getTranslations("public.legalConfidentialite"),
    getTranslations("public.legal"),
  ]);
  return { title: t("titre"), description: tLegal("metaDescription") };
}

export default async function ConfidentialitePage() {
  const t = await getTranslations("public.legalConfidentialite");
  return (
    <LegalPage titre={t("titre")} misAJour={new Date("2026-09-23")}>
      <p>{t("intro")}</p>

      <Section titre={t("s1Titre")}>
        <p className="rounded-sm bg-encre/5 px-3 py-2 text-encre/70">{t("s1Corps")}</p>
      </Section>

      <Section titre={t("s2Titre")}>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>{t("s2Item1Gras")}</strong>
            {t("s2Item1Reste")}
          </li>
          <li>
            <strong>{t("s2Item2Gras")}</strong>
            {t("s2Item2Reste")}
          </li>
          <li>
            <strong>{t("s2Item3Gras")}</strong>
            {t("s2Item3Reste")}
          </li>
          <li>
            <strong>{t("s2Item4Gras")}</strong>
            {t("s2Item4Reste")}
          </li>
        </ul>
        <p>{t("s2Corps")}</p>
        <p>{t("s2CorpsAudience")}</p>
      </Section>

      <Section titre={t("s3Titre")}>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t("s3Item1")}</li>
          <li>{t("s3Item2")}</li>
          <li>{t("s3Item3")}</li>
          <li>{t("s3Item4")}</li>
        </ul>
      </Section>

      <Section titre={t("s4Titre")}>
        <p>{t("s4Corps")}</p>
      </Section>

      <Section titre={t("s5Titre")}>
        <p>{t("s5Intro")}</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t("s5Item1")}</li>
          <li>{t("s5Item2")}</li>
          <li>{t("s5Item3")}</li>
          <li>{t("s5Item4")}</li>
        </ul>
        <p>{t("s5Corps")}</p>
      </Section>

      <Section titre={t("s6Titre")}>
        <p>
          {t("s6Part1")}
          <a href="/mentions-legales" className="underline">
            {t("s6Lien")}
          </a>
          {t("s6Part2")}
        </p>
        <p>{t("s6Corps2")}</p>
      </Section>

      <Section titre={t("s7Titre")}>
        <p>{t("s7Corps")}</p>
      </Section>
    </LegalPage>
  );
}
