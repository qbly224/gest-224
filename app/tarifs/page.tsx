import Link from "next/link";
import { LISTE_PLANS } from "@/lib/plans";

export default function TarifsPage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-encre/60">
            Gest-224
          </p>
          <h1 className="mt-2 font-titre text-3xl text-encre">
            Des tarifs simples, sans engagement
          </h1>
          <p className="mt-3 font-sans text-sm text-encre/70">
            Déjà inscrit ?{" "}
            <Link href="/connexion" className="underline">
              Se connecter
            </Link>
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {LISTE_PLANS.map((plan) => (
            <div
              key={plan.id}
              className="flex flex-col rounded-sm border border-encre/20 bg-white/40 p-6"
            >
              <h2 className="font-titre text-xl text-encre">{plan.label}</h2>
              <p className="mt-2 font-mono text-3xl text-encre">
                {plan.prixMensuel === 0 ? "0 €" : `${plan.prixMensuel} €`}
                <span className="font-sans text-sm text-encre/60"> / mois</span>
              </p>

              <ul className="mt-6 flex-1 space-y-2 font-sans text-sm text-encre/80">
                {plan.fonctionnalites.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-encre/40">—</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/inscription?plan=${plan.id}`}
                className="mt-6 rounded-sm bg-encre px-4 py-2 text-center font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
              >
                Choisir {plan.label}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center font-sans text-xs text-encre/50">
          Vous pourrez changer de plan à tout moment depuis votre espace.
        </p>
      </div>
    </main>
  );
}
