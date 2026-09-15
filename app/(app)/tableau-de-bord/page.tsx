import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TableauDeBordPage() {
  const session = await requireSession();

  const [tenant, nbClients, nbArticles] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId } }),
    prisma.client.count({ where: { tenantId: session.tenantId, actif: true } }),
    prisma.article.count({ where: { tenantId: session.tenantId, actif: true } }),
  ]);

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
          <p className="font-mono text-3xl text-encre">{nbClients}</p>
          <p className="mt-1 font-sans text-sm text-encre/70">
            Clients actifs
          </p>
        </div>
        <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
          <p className="font-mono text-3xl text-encre">{nbArticles}</p>
          <p className="mt-1 font-sans text-sm text-encre/70">
            Produits / services au catalogue
          </p>
        </div>
      </div>

      <p className="font-sans text-sm text-encre/60">
        Les devis, factures et la comptabilité arriveront dans les phases
        suivantes.
      </p>
    </div>
  );
}
