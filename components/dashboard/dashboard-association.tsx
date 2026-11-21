import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { formatEuros, formatDate } from "@/lib/format";
import { obtenirLocale } from "@/i18n/request";
import { PLANS } from "@/lib/plans";
import type { SessionPayload } from "@/lib/session";

export async function DashboardAssociation({ session }: { session: SessionPayload }) {
  const locale = await obtenirLocale();
  const t = await getTranslations("app.dashboard");

  const [tenant, nbMembresActifs, nbMembresTotal, cotisationsImpayees, prochainesReunions] =
    await Promise.all([
      prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId } }),
      prisma.membre.count({ where: { tenantId: session.tenantId, actif: true } }),
      prisma.membre.count({ where: { tenantId: session.tenantId } }),
      prisma.cotisation.findMany({
        where: { tenantId: session.tenantId, datePaiement: null },
        select: { montant: true },
      }),
      prisma.reunion.findMany({
        where: { tenantId: session.tenantId, date: { gte: new Date() } },
        orderBy: { date: "asc" },
        take: 5,
      }),
    ]);

  const plan = PLANS[tenant.plan];
  const montantImpaye = cotisationsImpayees.reduce((total, c) => total + Number(c.montant), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-titre text-2xl text-encre">{t("titre")}</h1>
        <p className="mt-1 font-sans text-sm text-encre/70">{tenant.raisonSociale}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-sm border border-encre/20 bg-white/40 p-5">
          <p className="font-sans text-sm text-encre/75">{t("membresActifs")}</p>
          <p className="mt-1 font-mono text-2xl text-encre">
            {nbMembresActifs}
            {plan.limiteMembres !== null && (
              <span className="text-encre/70"> / {plan.limiteMembres}</span>
            )}
          </p>
          <p className="mt-0.5 font-sans text-xs text-encre/70">
            {t("surTotal", { total: nbMembresTotal })}
          </p>
        </div>

        <div className="rounded-sm border border-encre/20 bg-white/40 p-5">
          <p className="font-sans text-sm text-encre/75">{t("cotisationsImpayees")}</p>
          <p className="mt-1 font-mono text-2xl text-encre">{cotisationsImpayees.length}</p>
          {cotisationsImpayees.length > 0 && (
            <p className="mt-0.5 font-sans text-xs text-encre/70">
              {formatEuros(montantImpaye, locale)}
            </p>
          )}
        </div>

        <div className="rounded-sm border border-encre/20 bg-white/40 p-5">
          <p className="font-sans text-sm text-encre/75">{t("prochainesReunions")}</p>
          <p className="mt-1 font-mono text-2xl text-encre">{prochainesReunions.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-titre text-lg text-encre">{t("prochainesReunions")}</h2>
            <Link href="/reunions" className="font-sans text-sm text-encre underline">
              {t("voirTout")}
            </Link>
          </div>
          {prochainesReunions.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-encre/75">{t("aucuneReunion")}</p>
          ) : (
            <ul className="mt-3 divide-y divide-encre/10">
              {prochainesReunions.map((reunion) => (
                <li key={reunion.id} className="py-2">
                  <Link
                    href={`/reunions/${reunion.id}`}
                    className="font-sans text-sm text-encre hover:underline"
                  >
                    {reunion.titre}
                  </Link>
                  <p className="font-mono text-xs text-encre/70">
                    {formatDate(reunion.date, locale, { dateStyle: "long", timeStyle: "short" })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-titre text-lg text-encre">{t("cotisationsImpayees")}</h2>
            <Link href="/cotisations?statut=impayees" className="font-sans text-sm text-encre underline">
              {t("voirTout")}
            </Link>
          </div>
          {cotisationsImpayees.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-encre/75">{t("aucuneCotisationImpayee")}</p>
          ) : (
            <p className="mt-3 font-sans text-sm text-encre/80">
              {t("montantTotalImpaye", { montant: formatEuros(montantImpaye, locale) })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
