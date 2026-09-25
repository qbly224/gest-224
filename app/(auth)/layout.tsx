import Link from "next/link";

const VALEURS = [
  "Devis et factures conformes aux normes françaises",
  "Chaîne documentaire complète, du devis à l'avoir",
  "Comptabilité simplifiée : recettes, dépenses, solde",
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Bandeau de marque — mobile/tablette uniquement (le panneau ci-dessous est masqué) */}
      <header className="flex items-center justify-between border-b border-encre/15 px-6 py-4 lg:hidden">
        <Link href="/" className="font-titre text-lg text-encre">
          Gest-224
        </Link>
        <Link href="/" className="font-sans text-xs text-encre/60 underline">
          Retour au site
        </Link>
      </header>

      {/* Panneau de marque — bureau uniquement, reste visible pendant le défilement du formulaire */}
      <aside className="relative hidden w-full max-w-md flex-col justify-between overflow-hidden bg-encre px-10 py-12 text-ivoire lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, currentColor 0, currentColor 1px, transparent 1px, transparent 32px)",
          }}
          aria-hidden="true"
        />
        <div className="relative">
          <Link href="/" className="font-titre text-xl">
            Gest-224
          </Link>
        </div>
        <div className="relative">
          <p className="font-titre text-3xl leading-snug">
            Devis, factures et comptabilité,
            <br />
            sans y passer vos soirées.
          </p>
          <ul className="mt-8 space-y-3 font-sans text-sm text-ivoire/80">
            {VALEURS.map((v) => (
              <li key={v} className="flex gap-2">
                <span className="mt-0.5 text-ivoire/50">—</span>
                <span>{v}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative">
          <Link
            href="/"
            className="font-sans text-xs text-ivoire/60 underline hover:text-ivoire"
          >
            ← Retour au site
          </Link>
        </div>
      </aside>

      {/* Formulaire */}
      <main className="flex-1 px-6 py-12 sm:py-20 lg:h-screen lg:overflow-y-auto">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
