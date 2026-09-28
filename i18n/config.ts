export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_DEFAUT: Locale = "fr";
export const COOKIE_LOCALE = "locale";
