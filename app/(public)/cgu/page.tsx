import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage, Section } from "@/components/public/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const [t, tLegal] = await Promise.all([
    getTranslations("public.legalCgu"),
    getTranslations("public.legal"),
  ]);
  return { title: t("titre"), description: tLegal("metaDescription") };
}

export default async function CguPage() {
  const t = await getTranslations("public.legalCgu");
  return (
    <LegalPage titre={t("titre")} misAJour={new Date("2026-09-23")}>
      <p>{t("intro")}</p>

      <Section titre={t("s1Titre")}>
        <p>{t("s1Corps")}</p>
      </Section>

      <Section titre={t("s2Titre")}>
        <p>{t("s2Corps")}</p>
      </Section>

      <Section titre={t("s3Titre")}>
        <p>{t("s3Corps")}</p>
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

      <Section titre={t("s7Titre")}>
        <p>{t("s7Corps")}</p>
      </Section>

      <Section titre={t("s8Titre")}>
        <p>{t("s8Corps")}</p>
      </Section>

      <Section titre={t("s9Titre")}>
        <p>{t("s9Corps")}</p>
      </Section>
    </LegalPage>
  );
}
