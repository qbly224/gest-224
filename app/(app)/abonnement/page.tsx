import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compterDocumentsMoisCourant } from "@/lib/documents/usage";
import { compterDepensesMoisCourant } from "@/lib/comptabilite/agregats";
import { LISTE_PLANS, PLANS } from "@/lib/plans";
import { changerPlan } from "@/lib/actions/abonnement";

export default async function AbonnementPage() {
  const session = await requireSession();

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
        Aucun paiement n&apos;est traité pour l&apos;instant : le changement de
        plan est immédiat.
      </p>

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

      {planActuel.rapportComplet && (
        <p className="mt-6 font-sans text-sm text-encre">
          Votre plan donne accès au{" "}
          <Link href="/rapport" className="underline">
            rapport complet
          </Link>
          .
        </p>
      )}

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
              <form action={changerPlan} className="mt-6">
                <input type="hidden" name="plan" value={plan.id} />
                <button
                  type="submit"
                  disabled={estActuel}
                  className="w-full rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {estActuel ? "Plan actuel" : "Passer à ce plan"}
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
