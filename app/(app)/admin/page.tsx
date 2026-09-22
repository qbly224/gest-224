import { requirePlatformAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import { LISTE_PLANS } from "@/lib/plans";
import { basculerActifTenant, changerPlanTenant } from "@/lib/actions/admin";

export default async function AdminPage() {
  await requirePlatformAdmin();

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true, documents: true, clients: true } },
    },
  });

  const [nbTenantsActifs, nbUsersTotal, nbDocumentsTotal] = await Promise.all([
    prisma.tenant.count({ where: { actif: true } }),
    prisma.user.count(),
    prisma.document.count(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-titre text-2xl text-encre">Administration de la plateforme</h1>
        <p className="mt-1 font-sans text-sm text-encre/70">
          Vue sur l&apos;ensemble des entreprises inscrites sur Gest-224.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
          <p className="font-mono text-3xl text-encre">
            {tenants.length}
            <span className="text-encre/50"> / {nbTenantsActifs} actives</span>
          </p>
          <p className="mt-1 font-sans text-sm text-encre/70">Entreprises inscrites</p>
        </div>
        <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
          <p className="font-mono text-3xl text-encre">{nbUsersTotal}</p>
          <p className="mt-1 font-sans text-sm text-encre/70">Utilisateurs</p>
        </div>
        <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
          <p className="font-mono text-3xl text-encre">{nbDocumentsTotal}</p>
          <p className="mt-1 font-sans text-sm text-encre/70">Documents créés (tous tenants)</p>
        </div>
      </div>

      <table className="w-full border-collapse font-sans text-sm">
        <thead>
          <tr className="border-b border-encre/20 text-left text-encre/60">
            <th className="py-2 font-medium">Entreprise</th>
            <th className="py-2 font-medium">SIRET</th>
            <th className="py-2 text-right font-medium">Users</th>
            <th className="py-2 text-right font-medium">Clients</th>
            <th className="py-2 text-right font-medium">Documents</th>
            <th className="py-2 font-medium">Créée le</th>
            <th className="py-2 font-medium">Plan</th>
            <th className="py-2 font-medium">Statut</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((t) => (
            <tr key={t.id} className="border-b border-encre/10 align-middle">
              <td className="py-2 text-encre">{t.raisonSociale}</td>
              <td className="py-2 font-mono text-xs text-encre/70">{t.siret}</td>
              <td className="py-2 text-right font-mono text-encre/80">{t._count.users}</td>
              <td className="py-2 text-right font-mono text-encre/80">{t._count.clients}</td>
              <td className="py-2 text-right font-mono text-encre/80">{t._count.documents}</td>
              <td className="py-2 font-mono text-xs text-encre/70">
                {new Intl.DateTimeFormat("fr-FR").format(t.createdAt)}
              </td>
              <td className="py-2">
                <form action={changerPlanTenant.bind(null, t.id)} className="flex items-center gap-1">
                  <select
                    name="plan"
                    defaultValue={t.plan}
                    className="rounded-sm border border-encre/30 bg-transparent px-1 py-0.5 font-sans text-xs text-encre"
                  >
                    {LISTE_PLANS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-sm border border-encre/30 px-2 py-0.5 font-sans text-xs text-encre hover:bg-encre/5"
                  >
                    OK
                  </button>
                </form>
              </td>
              <td className="py-2">
                <form action={basculerActifTenant.bind(null, t.id)}>
                  <button
                    type="submit"
                    className={`rounded-sm border px-2 py-0.5 font-sans text-xs ${
                      t.actif
                        ? "border-encre/30 text-encre hover:bg-encre/5"
                        : "border-red-300 text-red-700 hover:bg-red-50"
                    }`}
                  >
                    {t.actif ? "Active" : "Désactivée"}
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
