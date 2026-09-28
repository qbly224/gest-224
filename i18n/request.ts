import "server-only";
import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { COOKIE_LOCALE, LOCALE_DEFAUT, type Locale } from "./config";

export async function obtenirLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const valeur = cookieStore.get(COOKIE_LOCALE)?.value;
  return valeur === "en" ? "en" : LOCALE_DEFAUT;
}

export default getRequestConfig(async () => {
  const locale = await obtenirLocale();
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
