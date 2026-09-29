import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage, Section } from "@/components/public/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const [t, tLegal] = await Promise.all([
    getTranslations("public.legalCgv"),
    getTranslations("public.legal"),
  ]);
  return { title: t("titre"), description: tLegal("metaDescription") };
}

export default async function CgvPage() {
  const t = await getTranslations("public.legalCgv");
  return (
    <LegalPage titre={t("titre")} misAJour={new Date("2026-09-23")}>
      <p>
        {t("introPart1")}
        <a href="/cgu" className="underline">
          {t("introLien")}
        </a>
        {t("introPart2")}
      </p>

      <Section titre={t("s1Titre")}>
        <p>{t("s1Corps")}</p>
      </Section>

      <Section titre={t("s2Titre")}>
        <p>
          {t("s2Part1")}
          <a href="/tarifs" className="underline">
            {t("s2Lien")}
          </a>
          {t("s2Part2")}
        </p>
      </Section>

      <Section titre={t("s3Titre")}>
        <p>{t("s3Intro")}</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>{t("s3Item1Gras")}</strong>
            {t("s3Item1Reste")}
          </li>
          <li>
            <strong>{t("s3Item2Gras")}</strong>
            {t("s3Item2Reste")}
          </li>
        </ul>
      </Section>

      <Section titre={t("s4Titre")}>
        <p>{t("s4Corps")}</p>
      </Section>

      <Section titre={t("s5Titre")}>
        <p>{t("s5Corps")}</p>
      </Section>

      <Section titre={t("s6Titre")}>
        <p>{t("s6Corps")}</p>
      </Section>
    </LegalPage>
  );
}
