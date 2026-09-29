import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/app/locale-switcher";
import { ThemeToggle } from "@/components/public/theme-toggle";

export async function PublicHeader() {
  const t = await getTranslations("public.header");

  return (
    <header className="sticky top-0 z-20 border-b border-encre/15 bg-ivoire/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <Link href="/" className="font-titre text-lg text-encre">
          Gest-224
        </Link>
        <nav className="flex flex-wrap items-center gap-6 font-sans text-sm text-encre/80">
          <Link href="/tarifs" className="hover:text-encre">
            {t("tarifs")}
          </Link>
          <Link href="/a-propos" className="hover:text-encre">
            {t("aPropos")}
          </Link>
          <Link href="/connexion" className="hover:text-encre">
            {t("connexion")}
          </Link>
          <ThemeToggle />
          <LocaleSwitcher />
          <Link
            href="/inscription"
            className="rounded-sm bg-encre px-4 py-2 font-medium text-ivoire hover:bg-encre-light"
          >
            {t("essayerGratuitement")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
