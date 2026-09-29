import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage, Section } from "@/components/public/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const [t, tLegal] = await Promise.all([
    getTranslations("public.legalMentions"),
    getTranslations("public.legal"),
  ]);
  return { title: t("titre"), description: tLegal("metaDescription") };
}

export default async function MentionsLegalesPage() {
  const t = await getTranslations("public.legalMentions");
  return (
    <LegalPage titre={t("titre")} misAJour={new Date("2026-09-23")}>
      <p className="rounded-sm bg-red-50 px-3 py-2 text-red-700">{t("avertissement")}</p>

      <Section titre={t("editeurTitre")}>
        <p className="rounded-sm bg-encre/5 px-3 py-2 text-encre/70">{t("editeurCorps")}</p>
      </Section>

      <Section titre={t("directeurTitre")}>
        <p className="rounded-sm bg-encre/5 px-3 py-2 text-encre/70">{t("directeurCorps")}</p>
      </Section>

      <Section titre={t("hebergementTitre")}>
        <p>
          {t("hebergementCorps1Debut")} <strong>{t("hebergementCorps1Gras")}</strong>
          {t("hebergementCorps1Reste")}
        </p>
        <p>
          {t("hebergementCorps2Debut")} <strong>{t("hebergementCorps2Gras")}</strong>
          {t("hebergementCorps2Reste")}
        </p>
      </Section>

      <Section titre={t("proprieteTitre")}>
        <p>{t("proprieteCorps")}</p>
      </Section>

      <Section titre={t("contactTitre")}>
        <p className="rounded-sm bg-encre/5 px-3 py-2 text-encre/70">{t("contactCorps")}</p>
      </Section>
    </LegalPage>
  );
}
