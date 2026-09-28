import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CookieLink } from "@/components/public/cookie-link";

export async function PublicFooter() {
  const t = await getTranslations("public.footer");
  const tHeader = await getTranslations("public.header");

  const colonnes = [
    {
      titre: t("produit"),
      liens: [
        { href: "/tarifs", label: tHeader("tarifs") },
        { href: "/a-propos", label: tHeader("aPropos") },
        { href: "/inscription", label: t("creerCompte") },
        { href: "/connexion", label: tHeader("connexion") },
      ],
    },
    {
      titre: t("legal"),
      liens: [
        { href: "/cgu", label: t("cgu") },
        { href: "/cgv", label: t("cgv") },
        { href: "/confidentialite", label: t("confidentialite") },
        { href: "/mentions-legales", label: t("mentionsLegales") },
        { href: "#cookies", label: t("cookies") },
      ],
    },
  ];

  return (
    <footer className="border-t border-encre/15">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div>
            <p className="font-titre text-lg text-encre">Gest-224</p>
            <p className="mt-2 font-sans text-sm text-encre/60">{t("tagline")}</p>
          </div>
          {colonnes.map((colonne) => (
            <div key={colonne.titre}>
              <p className="font-sans text-xs font-medium uppercase tracking-wide text-encre/50">
                {colonne.titre}
              </p>
              <ul className="mt-3 space-y-2 font-sans text-sm text-encre/70">
                {colonne.liens.map((l) => (
                  <li key={l.href}>
                    {l.href === "#cookies" ? (
                      <CookieLink />
                    ) : (
                      <Link href={l.href} className="hover:text-encre hover:underline">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-10 border-t border-encre/10 pt-6 font-sans text-xs text-encre/50">
          © {new Date().getFullYear()} Gest-224. {t("droitsReserves")}
        </p>
      </div>
    </footer>
  );
}
