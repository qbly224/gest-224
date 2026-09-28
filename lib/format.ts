import type { Locale } from "@/i18n/config";

function intlLocale(locale: Locale): string {
  return locale === "en" ? "en-US" : "fr-FR";
}

export function formatEuros(n: number, locale: Locale = "fr"): string {
  return new Intl.NumberFormat(intlLocale(locale), { style: "currency", currency: "EUR" }).format(n);
}

export function formatDate(d: Date, locale: Locale = "fr", options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(intlLocale(locale), options).format(d);
}

export function formatMoisAnnee(d: Date, locale: Locale = "fr"): string {
  return formatDate(d, locale, { month: "long", year: "numeric" });
}
