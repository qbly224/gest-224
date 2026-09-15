import Link from "next/link";
import { signOut } from "@/lib/actions/auth";

const links = [
  { href: "/tableau-de-bord", label: "Tableau de bord" },
  { href: "/clients", label: "Clients" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/entreprise", label: "Entreprise" },
];

export function AppNav({ raisonSociale }: { raisonSociale: string }) {
  return (
    <header className="border-b border-encre/20 bg-ivoire">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-baseline gap-6">
          <span className="font-titre text-lg text-encre">Gest-224</span>
          <span className="font-mono text-xs text-encre/60">
            {raisonSociale}
          </span>
        </div>
        <nav className="flex flex-wrap items-center gap-5 font-sans text-sm text-encre/80">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-encre">
              {link.label}
            </Link>
          ))}
          <form action={signOut}>
            <button type="submit" className="hover:text-encre">
              Déconnexion
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
