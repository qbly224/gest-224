import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculerRapportComplet } from "@/lib/comptabilite/agregats";
import { PLANS } from "@/lib/plans";
import { TITRES_DOCUMENT } from "@/lib/documents/statut-labels";
import { BoutonImprimer } from "@/components/rapport/bouton-imprimer";
import type { TypeDocument } from "@prisma/client";

function formatEuros(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

export default async function RapportPage() {
  const session = await requireSession();
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId } });
  const plan = PLANS[tenant.plan];

  if (!plan.rapportComplet) {
    return (
      <div>
        <h1 className="font-titre text-2xl text-encre">Rapport complet</h1>
        <p className="mt-4 font-sans text-sm text-encre/70">
          Le rapport complet (comptabilité détaillée, activité par client, historique sur 12
          mois) est réservé aux plans Starter et Pro.
        </p>
        <Link
          href="/abonnement"
          className="mt-4 inline-block rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
        >
          Voir les plans
        </Link>
      </div>
    );
  }

  const rapport = await calculerRapportComplet(session.tenantId);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-titre text-2xl text-encre">Rapport complet</h1>
          <p className="mt-1 font-sans text-sm text-encre/70">{tenant.raisonSociale}</p>
        </div>
        <BoutonImprimer />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
          <p
            className={`font-mono text-3xl ${rapport.soldeEtVueMensuelle.solde >= 0 ? "text-encre" : "text-red-700"}`}
          >
            {formatEuros(rapport.soldeEtVueMensuelle.solde)}
          </p>
          <p className="mt-1 font-sans text-sm text-encre/70">Solde global</p>
        </div>
        <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
          <p className="font-mono text-3xl text-encre">
            {formatEuros(rapport.soldeEtVueMensuelle.totalRecettes)}
          </p>
          <p className="mt-1 font-sans text-sm text-encre/70">Total recettes</p>
        </div>
        <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
          <p className="font-mono text-3xl text-encre">
            {formatEuros(rapport.soldeEtVueMensuelle.totalDepenses)}
          </p>
          <p className="mt-1 font-sans text-sm text-encre/70">Total dépenses</p>
        </div>
      </div>

      <div>
        <h2 className="font-titre text-lg text-encre">Vue mensuelle (12 mois)</h2>
        <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse font-sans text-sm">
          <thead>
            <tr className="border-b border-encre/20 text-left text-encre/60">
              <th className="py-2 font-medium">Mois</th>
              <th className="py-2 text-right font-medium">Recettes</th>
              <th className="py-2 text-right font-medium">Dépenses</th>
              <th className="py-2 text-right font-medium">Solde</th>
            </tr>
          </thead>
          <tbody>
            {rapport.soldeEtVueMensuelle.mois.map((m) => (
              <tr key={m.mois} className="border-b border-encre/10">
                <td className="py-2 capitalize text-encre">{m.label}</td>
                <td className="py-2 text-right font-mono text-encre/80">{formatEuros(m.recettes)}</td>
                <td className="py-2 text-right font-mono text-encre/80">{formatEuros(m.depenses)}</td>
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

      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
        <div>
          <h2 className="font-titre text-lg text-encre">Dépenses par catégorie</h2>
          {rapport.depensesParCategorie.length === 0 ? (
            <p className="mt-4 font-sans text-sm text-encre/60">Aucune dépense enregistrée.</p>
          ) : (
            <table className="mt-4 w-full border-collapse font-sans text-sm">
              <tbody>
                {rapport.depensesParCategorie.map((d) => (
                  <tr key={d.categorie} className="border-b border-encre/10">
                    <td className="py-2 text-encre">{d.categorie}</td>
                    <td className="py-2 text-right font-mono text-encre/80">
                      {formatEuros(d.montant)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
          <h2 className="font-titre text-lg text-encre">Meilleurs clients (par recettes)</h2>
          {rapport.topClients.length === 0 ? (
            <p className="mt-4 font-sans text-sm text-encre/60">Aucune recette enregistrée.</p>
          ) : (
            <table className="mt-4 w-full border-collapse font-sans text-sm">
              <tbody>
                {rapport.topClients.map((c) => (
                  <tr key={c.nom} className="border-b border-encre/10">
                    <td className="py-2 text-encre">{c.nom}</td>
                    <td className="py-2 text-right font-mono text-encre/80">
                      {formatEuros(c.montant)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-titre text-lg text-encre">Documents par type</h2>
        <table className="mt-4 w-full border-collapse font-sans text-sm">
          <tbody>
            {rapport.documentsParType.map((d) => (
              <tr key={d.type} className="border-b border-encre/10">
                <td className="py-2 text-encre">{TITRES_DOCUMENT[d.type as TypeDocument]}</td>
                <td className="py-2 text-right font-mono text-encre/80">{d.nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
