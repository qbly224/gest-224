"use client";

import { useTranslations } from "next-intl";
import { OUVRIR_COOKIES_EVENT } from "@/components/app/cookie-consent";

export function CookieLink() {
  const t = useTranslations("public.footer");
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OUVRIR_COOKIES_EVENT))}
      className="text-left hover:text-white hover:underline"
    >
      {t("cookies")}
    </button>
  );
}
