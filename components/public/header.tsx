import Link from "next/link";

const liens = [
  { href: "/tarifs", label: "Tarifs" },
  { href: "/a-propos", label: "À propos" },
];

export function PublicHeader() {
  return (
    <header className="border-b border-encre/15">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <Link href="/" className="font-titre text-lg text-encre">
          Gest-224
        </Link>
        <nav className="flex flex-wrap items-center gap-6 font-sans text-sm text-encre/80">
          {liens.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-encre">
              {l.label}
            </Link>
          ))}
          <Link href="/connexion" className="hover:text-encre">
            Connexion
          </Link>
          <Link
            href="/inscription"
            className="rounded-sm bg-encre px-4 py-2 font-medium text-ivoire hover:bg-encre-light"
          >
            Essayer gratuitement
          </Link>
        </nav>
      </div>
    </header>
  );
}
