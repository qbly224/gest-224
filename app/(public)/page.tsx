import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LISTE_PLANS } from "@/lib/plans";

const FONCTIONNALITES = [
  {
    titre: "Devis et factures conformes",
    description:
      "Numérotation séquentielle sans trou, mentions légales obligatoires, PDF prêts à envoyer.",
  },
  {
    titre: "Chaîne documentaire complète",
    description:
      "Devis → bon de commande → bon de livraison → facture → avoir, chaque document référence le précédent.",
  },
  {
    titre: "Comptabilité simplifiée",
    description:
      "Recettes générées automatiquement à l'encaissement, dépenses saisies à la main, solde et vue mensuelle en un coup d'œil.",
  },
  {
    titre: "Franchise en base gérée",
    description:
      "Régime de TVA normal ou franchise en base (art. 293 B du CGI) — la mention adaptée s'affiche automatiquement.",
  },
  {
    titre: "Envoi en un clic",
    description:
      "Téléchargez le PDF et ouvrez directement un brouillon Gmail ou WhatsApp pré-rempli pour votre client.",
  },
  {
    titre: "Multi-entreprise, isolé",
    description:
      "Chaque compte est cloisonné : vos données ne sont jamais mélangées avec celles d'une autre entreprise.",
  },
];

export default async function AccueilPage() {
  const session = await getSession();
  if (session) {
    redirect("/tableau-de-bord");
  }

  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-20 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-encre/60">
          Gestion commerciale pour petites entreprises françaises
        </p>
        <h1 className="mt-4 font-titre text-4xl text-encre sm:text-5xl">
          Devis, factures et comptabilité,
          <br className="hidden sm:block" /> sans y passer vos soirées.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl font-sans text-base text-encre/70">
          Gest-224 gère toute votre chaîne documentaire — du devis à la facture —
          conforme aux normes françaises, avec une comptabilité simplifiée intégrée.
          Pensé pour les auto-entrepreneurs et petites entreprises.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/inscription"
            className="rounded-sm bg-encre px-6 py-3 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
          >
            Créer mon compte gratuitement
          </Link>
          <Link
            href="/tarifs"
            className="rounded-sm border border-encre/30 px-6 py-3 font-sans text-sm text-encre hover:bg-encre/5"
          >
            Voir les tarifs
          </Link>
        </div>
        <p className="mt-4 font-sans text-xs text-encre/50">
          Aucune carte bancaire requise pour le plan gratuit.
        </p>
      </section>

      <section className="border-t border-encre/10 bg-white/40 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center font-titre text-2xl text-encre">
            Tout ce qu&apos;il faut, rien de superflu
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FONCTIONNALITES.map((f) => (
              <div key={f.titre}>
                <h3 className="font-titre text-lg text-encre">{f.titre}</h3>
                <p className="mt-2 font-sans text-sm text-encre/70">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-titre text-2xl text-encre">Un tarif pour chaque étape</h2>
          <p className="mt-2 font-sans text-sm text-encre/70">
            Commencez gratuitement, passez à un plan supérieur quand votre activité grandit.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {LISTE_PLANS.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-col rounded-sm border border-encre/20 bg-white/40 p-6 text-left"
              >
                <h3 className="font-titre text-xl text-encre">{plan.label}</h3>
                <p className="mt-2 font-mono text-2xl text-encre">
                  {plan.prixMensuel === 0 ? "0 €" : `${plan.prixMensuel} €`}
                  <span className="font-sans text-sm text-encre/60"> / mois</span>
                </p>
                <Link
                  href={`/inscription?plan=${plan.id}`}
                  className="mt-4 rounded-sm border border-encre/30 px-4 py-2 text-center font-sans text-sm text-encre hover:bg-encre/5"
                >
                  Choisir {plan.label}
                </Link>
              </div>
            ))}
          </div>
          <Link href="/tarifs" className="mt-6 inline-block font-sans text-sm text-encre underline">
            Comparer le détail des plans
          </Link>
        </div>
      </section>

      <section className="border-t border-encre/10 bg-encre py-16">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-titre text-2xl text-ivoire">Prêt à démarrer ?</h2>
          <p className="mt-2 font-sans text-sm text-ivoire/70">
            Créez votre compte en moins de deux minutes.
          </p>
          <Link
            href="/inscription"
            className="mt-6 inline-block rounded-sm bg-ivoire px-6 py-3 font-sans text-sm font-medium text-encre hover:bg-ivoire/90"
          >
            Créer mon compte
          </Link>
        </div>
      </section>
    </main>
  );
}
