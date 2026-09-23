import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compterDocumentsMoisCourant } from "@/lib/documents/usage";
import { compterDepensesMoisCourant } from "@/lib/comptabilite/agregats";
import { LISTE_PLANS, PLANS } from "@/lib/plans";
import { choisirPlanPaye, annulerAbonnement, ouvrirPortailFacturation } from "@/lib/actions/paiement";

export default async function AbonnementPage({
  searchParams,
}: {
  searchParams: Promise<{ paiement?: string }>;
}) {
  const session = await requireSession();
  const { paiement } = await searchParams;

  const [tenant, nbClients, nbDocumentsCeMois, nbDepensesCeMois] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId } }),
    prisma.client.count({ where: { tenantId: session.tenantId } }),
    compterDocumentsMoisCourant(session.tenantId),
    compterDepensesMoisCourant(session.tenantId),
  ]);

  const planActuel = PLANS[tenant.plan];

  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">Abonnement</h1>
      <p className="mt-1 font-sans text-sm text-encre/70">
        Plan actuel : <span className="font-medium text-encre">{planActuel.label}</span>
        {planActuel.prixMensuel > 0 ? ` — ${planActuel.prixMensuel} €/mois` : " — gratuit"}.
      </p>

      {paiement === "succes" && (
        <p className="mt-4 rounded-sm bg-encre/10 px-3 py-2 font-sans text-sm text-encre">
          Paiement confirmé — votre plan a été mis à jour.
        </p>
      )}
      {paiement === "annule" && (
        <p className="mt-4 rounded-sm bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
          Paiement annulé — votre plan n&apos;a pas changé.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
          <p className="font-mono text-2xl text-encre">
            {nbDocumentsCeMois}
            {planActuel.limiteDocumentsParMois !== null && (
              <span className="text-encre/50"> / {planActuel.limiteDocumentsParMois}</span>
            )}
          </p>
          <p className="mt-1 font-sans text-sm text-encre/70">
            Documents créés ce mois-ci
          </p>
        </div>
        <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
          <p className="font-mono text-2xl text-encre">
            {nbClients}
            {planActuel.limiteClients !== null && (
              <span className="text-encre/50"> / {planActuel.limiteClients}</span>
            )}
          </p>
          <p className="mt-1 font-sans text-sm text-encre/70">Clients enregistrés</p>
        </div>
        <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
          <p className="font-mono text-2xl text-encre">
            {nbDepensesCeMois}
            {planActuel.limiteDepensesParMois !== null && (
              <span className="text-encre/50"> / {planActuel.limiteDepensesParMois}</span>
            )}
          </p>
          <p className="mt-1 font-sans text-sm text-encre/70">Dépenses saisies ce mois-ci</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        {planActuel.rapportComplet && (
          <p className="font-sans text-sm text-encre">
            Votre plan donne accès au{" "}
            <Link href="/rapport" className="underline">
              rapport complet
            </Link>
            .
          </p>
        )}
        {tenant.stripeCustomerId && (
          <form action={ouvrirPortailFacturation}>
            <button type="submit" className="font-sans text-sm text-encre underline">
              Gérer mon moyen de paiement et mes factures
            </button>
          </form>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {LISTE_PLANS.map((plan) => {
          const estActuel = plan.id === tenant.plan;
          return (
            <div
              key={plan.id}
              className={`flex flex-col rounded-sm border p-6 ${
                estActuel ? "border-encre bg-encre/5" : "border-encre/20 bg-white/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-titre text-xl text-encre">{plan.label}</h2>
                {estActuel && (
                  <span className="font-mono text-xs uppercase text-encre/60">
                    Plan actuel
                  </span>
                )}
              </div>
              <p className="mt-2 font-mono text-2xl text-encre">
                {plan.prixMensuel === 0 ? "0 €" : `${plan.prixMensuel} €`}
                <span className="font-sans text-sm text-encre/60"> / mois</span>
              </p>
              <ul className="mt-4 flex-1 space-y-2 font-sans text-sm text-encre/80">
                {plan.fonctionnalites.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-encre/40">—</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {plan.id === "gratuit" ? (
                <form action={annulerAbonnement} className="mt-6">
                  <button
                    type="submit"
                    disabled={estActuel}
                    className="w-full rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {estActuel ? "Plan actuel" : "Repasser au gratuit"}
                  </button>
                </form>
              ) : (
                <form action={choisirPlanPaye} className="mt-6">
                  <input type="hidden" name="plan" value={plan.id} />
                  <button
                    type="submit"
                    disabled={estActuel}
                    className="w-full rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {estActuel ? "Plan actuel" : "Passer à ce plan"}
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
