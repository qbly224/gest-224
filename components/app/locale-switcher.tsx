"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { COOKIE_LOCALE, type Locale } from "@/i18n/config";

export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function changerLangue(nouvelleLocale: Locale) {
    if (nouvelleLocale === locale) return;
    document.cookie = `${COOKIE_LOCALE}=${nouvelleLocale}; path=/; max-age=31536000; SameSite=Lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div
      className={`flex items-center gap-1 font-mono text-xs text-encre/60 ${className}`}
      aria-label="Langue"
    >
      <button
        type="button"
        onClick={() => changerLangue("fr")}
        disabled={isPending}
        className={locale === "fr" ? "font-semibold text-encre" : "hover:text-encre"}
      >
        FR
      </button>
      <span aria-hidden="true">/</span>
      <button
        type="button"
        onClick={() => changerLangue("en")}
        disabled={isPending}
        className={locale === "en" ? "font-semibold text-encre" : "hover:text-encre"}
      >
        EN
      </button>
    </div>
  );
}
