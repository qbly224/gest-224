import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { VilleLanding } from "@/components/public/ville-landing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("public.villeParis");
  return {
    title: t("titre"),
    description: t("intro"),
  };
}

export default function LogicielFacturationParisPage() {
  return <VilleLanding namespace="public.villeParis" />;
}
