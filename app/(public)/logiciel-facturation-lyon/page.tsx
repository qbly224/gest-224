import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { VilleLanding } from "@/components/public/ville-landing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("public.villeLyon");
  return {
    title: t("titre"),
    description: t("intro"),
  };
}

export default function LogicielFacturationLyonPage() {
  return <VilleLanding namespace="public.villeLyon" />;
}
