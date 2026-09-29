import { getTranslations, getLocale } from "next-intl/server";
import { requirePlatformAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import { LISTE_PLANS } from "@/lib/plans";
import {
  basculerActifTenant,
  changerPlanTenant,
  basculerPaiementValideTenant,
} from "@/lib/actions/admin";
import { formatDate } from "@/lib/format";
import { calculerStatistiquesAudience } from "@/lib/analytics";
import type { Locale } from "@/i18n/config";

export default async function AdminPage() {
  await requirePlatformAdmin();
  const t = await getTranslations("app.admin");
  const locale = (await getLocale()) as Locale;

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true, documents: true, clients: true } },
    },
  });

  const [nbTenantsActifs, nbUsersTotal, nbDocumentsTotal, audience] = await Promise.all([
    prisma.tenant.count({ where: { actif: true } }),
    prisma.user.count(),
    prisma.document.count(),
    calculerStatistiquesAudience(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-titre text-2xl text-encre">{t("titre")}</h1>
        <p className="mt-1 font-sans text-sm text-encre/70">{t("description")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
          <p className="font-mono text-3xl text-encre">
            {tenants.length}
            <span className="text-encre/50"> / {nbTenantsActifs} {t("actives")}</span>
          </p>
          <p className="mt-1 font-sans text-sm text-encre/70">{t("entreprisesInscrites")}</p>
        </div>
        <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
          <p className="font-mono text-3xl text-encre">{nbUsersTotal}</p>
          <p className="mt-1 font-sans text-sm text-encre/70">{t("utilisateurs")}</p>
        </div>
        <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
          <p className="font-mono text-3xl text-encre">{nbDocumentsTotal}</p>
          <p className="mt-1 font-sans text-sm text-encre/70">{t("documentsCrees")}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse font-sans text-sm">
        <thead>
          <tr className="border-b border-encre/20 text-left text-encre/60">
            <th className="py-2 font-medium">{t("colEntreprise")}</th>
            <th className="py-2 font-medium">{t("colSiret")}</th>
            <th className="py-2 text-right font-medium">{t("colUsers")}</th>
            <th className="py-2 text-right font-medium">{t("colClients")}</th>
            <th className="py-2 text-right font-medium">{t("colDocuments")}</th>
            <th className="py-2 font-medium">{t("colCreeLe")}</th>
            <th className="py-2 font-medium">{t("colPlan")}</th>
            <th className="py-2 font-medium">{t("colPaiement")}</th>
            <th className="py-2 font-medium">{t("colStatut")}</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((t2) => (
            <tr key={t2.id} className="border-b border-encre/10 align-middle">
              <td className="py-2 text-encre">{t2.raisonSociale}</td>
              <td className="py-2 font-mono text-xs text-encre/70">{t2.siret}</td>
              <td className="py-2 text-right font-mono text-encre/80">{t2._count.users}</td>
              <td className="py-2 text-right font-mono text-encre/80">{t2._count.clients}</td>
              <td className="py-2 text-right font-mono text-encre/80">{t2._count.documents}</td>
              <td className="py-2 font-mono text-xs text-encre/70">
                {formatDate(t2.createdAt, locale)}
              </td>
              <td className="py-2">
                <form action={changerPlanTenant.bind(null, t2.id)} className="flex items-center gap-1">
                  <select
                    name="plan"
                    defaultValue={t2.plan}
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
                    {t("ok")}
                  </button>
                </form>
              </td>
              <td className="py-2">
                {t2.plan === "gratuit" ? (
                  <span className="font-mono text-xs text-encre/40">—</span>
                ) : (
                  <form action={basculerPaiementValideTenant.bind(null, t2.id)}>
                    <button
                      type="submit"
                      className={`rounded-sm border px-2 py-0.5 font-sans text-xs ${
                        t2.paiementValide
                          ? "border-encre/30 text-encre hover:bg-encre/5"
                          : "border-red-300 text-red-700 hover:bg-red-50"
                      }`}
                    >
                      {t2.paiementValide ? t("valide") : t("enAttenteValider")}
                    </button>
                  </form>
                )}
              </td>
              <td className="py-2">
                <form action={basculerActifTenant.bind(null, t2.id)}>
                  <button
                    type="submit"
                    className={`rounded-sm border px-2 py-0.5 font-sans text-xs ${
                      t2.actif
                        ? "border-encre/30 text-encre hover:bg-encre/5"
                        : "border-red-300 text-red-700 hover:bg-red-50"
                    }`}
                  >
                    {t2.actif ? t("active") : t("desactivee")}
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <div>
        <h2 className="font-titre text-lg text-encre">{t("audienceTitre")}</h2>
        <p className="mt-1 font-sans text-sm text-encre/70">{t("audienceDescription")}</p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
            <p className="font-mono text-3xl text-encre">{audience.vues7Jours}</p>
            <p className="mt-1 font-sans text-sm text-encre/70">{t("audience7Jours")}</p>
          </div>
          <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
            <p className="font-mono text-3xl text-encre">{audience.vues30Jours}</p>
            <p className="mt-1 font-sans text-sm text-encre/70">{t("audience30Jours")}</p>
          </div>
        </div>

        {audience.pagesPopulaires.length > 0 && (
          <table className="mt-4 w-full max-w-md border-collapse font-sans text-sm">
            <tbody>
              {audience.pagesPopulaires.map((p) => (
                <tr key={p.path} className="border-b border-encre/10">
                  <td className="py-2 font-mono text-xs text-encre/70">{p.path}</td>
                  <td className="py-2 text-right font-mono text-encre/80">{p.vues}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
