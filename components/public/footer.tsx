import Link from "next/link";

const colonnes = [
  {
    titre: "Produit",
    liens: [
      { href: "/tarifs", label: "Tarifs" },
      { href: "/a-propos", label: "À propos" },
      { href: "/inscription", label: "Créer un compte" },
      { href: "/connexion", label: "Connexion" },
    ],
  },
  {
    titre: "Légal",
    liens: [
      { href: "/cgu", label: "Conditions générales d'utilisation" },
      { href: "/cgv", label: "Conditions générales de vente" },
      { href: "/confidentialite", label: "Politique de confidentialité" },
      { href: "/mentions-legales", label: "Mentions légales" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-encre/15">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div>
            <p className="font-titre text-lg text-encre">Gest-224</p>
            <p className="mt-2 font-sans text-sm text-encre/60">
              Devis, factures et comptabilité simplifiée pour les petites entreprises
              françaises.
            </p>
          </div>
          {colonnes.map((colonne) => (
            <div key={colonne.titre}>
              <p className="font-sans text-xs font-medium uppercase tracking-wide text-encre/50">
                {colonne.titre}
              </p>
              <ul className="mt-3 space-y-2 font-sans text-sm text-encre/70">
                {colonne.liens.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-encre hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-10 border-t border-encre/10 pt-6 font-sans text-xs text-encre/50">
          © {new Date().getFullYear()} Gest-224. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
