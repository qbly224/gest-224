import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculerSoldeEtVueMensuelle } from "@/lib/comptabilite/agregats";
import { compterDocumentsMoisCourant } from "@/lib/documents/usage";
import { OnboardingChecklist } from "@/components/app/onboarding-checklist";
import { GraphiqueMensuel } from "@/components/dashboard/graphique-mensuel";
import { PLANS } from "@/lib/plans";

function formatEuros(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

export default async function TableauDeBordPage() {
  const session = await requireSession();

  const [tenant, nbClients, nbArticles, nbDocuments, nbDocumentsCeMois, compta] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId } }),
    prisma.client.count({ where: { tenantId: session.tenantId, actif: true } }),
    prisma.article.count({ where: { tenantId: session.tenantId, actif: true } }),
    prisma.document.count({ where: { tenantId: session.tenantId } }),
    compterDocumentsMoisCourant(session.tenantId),
    calculerSoldeEtVueMensuelle(session.tenantId),
  ]);
  const plan = PLANS[tenant.plan];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-titre text-2xl text-encre">Tableau de bord</h1>
        <p className="mt-1 font-sans text-sm text-encre/70">
          {tenant.raisonSociale} — régime{" "}
          {tenant.regimeTva === "franchise"
            ? "franchise en base (art. 293 B du CGI)"
            : "normal"}
        </p>
      </div>

      {!tenant.onboardingMasque && (
        <OnboardingChecklist
          etapes={[
            {
              label: "Renseigner l'IBAN de l'entreprise",
              fait: Boolean(tenant.iban),
              href: "/entreprise",
            },
            { label: "Ajouter un client", fait: nbClients > 0, href: "/clients/nouveau" },
            {
              label: "Ajouter un article au catalogue",
              fait: nbArticles > 0,
              href: "/catalogue/nouveau",
            },
            { label: "Créer votre premier devis", fait: nbDocuments > 0, href: "/devis/nouveau" },
          ]}
        />
      )}

      <div className="rounded-sm border border-encre/20 bg-white/40 p-8">
        <p className="font-sans text-sm text-encre/60">Solde global (recettes − dépenses)</p>
        <p
          className={`mt-1 font-mono text-5xl ${compta.solde >= 0 ? "text-encre" : "text-red-700"}`}
        >
          {formatEuros(compta.solde)}
        </p>
        <div className="mt-3 flex gap-6 font-sans text-xs text-encre/60">
          <span>
            Recettes totales <span className="font-mono text-encre/80">{formatEuros(compta.totalRecettes)}</span>
          </span>
          <span>
            Dépenses totales <span className="font-mono text-encre/80">{formatEuros(compta.totalDepenses)}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
          <p className="font-mono text-3xl text-encre">
            {nbDocumentsCeMois}
            {plan.limiteDocumentsParMois !== null && (
              <span className="text-encre/50"> / {plan.limiteDocumentsParMois}</span>
            )}
          </p>
          <p className="mt-1 font-sans text-sm text-encre/70">Documents créés ce mois-ci</p>
        </div>
        <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
          <p className="font-mono text-3xl text-encre">{nbClients}</p>
          <p className="mt-1 font-sans text-sm text-encre/70">Clients actifs</p>
        </div>
        <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
          <p className="font-mono text-3xl text-encre">{nbArticles}</p>
          <p className="mt-1 font-sans text-sm text-encre/70">
            Produits / services au catalogue
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-titre text-lg text-encre">Vue mensuelle</h2>
          <div className="flex gap-4 font-sans text-sm">
            <Link href="/recettes" className="text-encre underline">
              Recettes
            </Link>
            <Link href="/depenses" className="text-encre underline">
              Dépenses
            </Link>
            <Link href="/rapport" className="text-encre underline">
              Rapport complet
            </Link>
          </div>
        </div>

        <div className="mt-4 rounded-sm border border-encre/20 bg-white/40 p-6">
          <GraphiqueMensuel mois={compta.mois} />
        </div>

        <table className="mt-6 w-full border-collapse font-sans text-sm">
          <thead>
            <tr className="border-b border-encre/20 text-left text-encre/60">
              <th className="py-2 font-medium">Mois</th>
              <th className="py-2 text-right font-medium">Recettes</th>
              <th className="py-2 text-right font-medium">Dépenses</th>
              <th className="py-2 text-right font-medium">Solde</th>
            </tr>
          </thead>
          <tbody>
            {compta.mois.map((m) => (
              <tr key={m.mois} className="border-b border-encre/10">
                <td className="py-2 capitalize text-encre">{m.label}</td>
                <td className="py-2 text-right font-mono text-encre/80">
                  {formatEuros(m.recettes)}
                </td>
                <td className="py-2 text-right font-mono text-encre/80">
                  {formatEuros(m.depenses)}
                </td>
                <td
                  className={`py-2 text-right font-mono ${m.solde >= 0 ? "text-encre" : "text-red-700"}`}
                >
                  {formatEuros(m.solde)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
