import { getTranslations, getLocale } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EntrepriseForm } from "@/components/entreprise/entreprise-form";
import { SupprimerCompteForm } from "@/components/entreprise/supprimer-compte-form";
import { basculerRelancesActivees } from "@/lib/actions/entreprise";
import { formatDate } from "@/lib/format";
import { TotpSection } from "@/components/securite/totp-section";
import type { Locale } from "@/i18n/config";

export default async function EntreprisePage() {
  const session = await requireSession();
  const t = await getTranslations("app.entreprise");
  const locale = (await getLocale()) as Locale;
  const [tenant, journalAudit, utilisateur] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId } }),
    prisma.auditLog.findMany({
      where: { tenantId: session.tenantId },
      include: { user: { select: { prenom: true, nom: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      select: { totpEnabled: true },
    }),
  ]);

  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">{t("titre")}</h1>
      <p className="mt-1 font-sans text-sm text-encre/70">{t("description")}</p>
      <EntrepriseForm
        tenant={{
          ...tenant,
          capitalSocial: tenant.capitalSocial ? tenant.capitalSocial.toString() : null,
        }}
      />

      <div className="mt-12 rounded-sm border border-encre/20 bg-white/40 p-6">
        <h2 className="font-titre text-lg text-encre">{t("relancesTitre")}</h2>
        <p className="mt-1 font-sans text-sm text-encre/70">{t("relancesDescription")}</p>
        <form action={basculerRelancesActivees} className="mt-4">
          <button
            type="submit"
            className={`rounded-sm border px-4 py-2 font-sans text-sm ${
              tenant.relancesActivees
                ? "border-encre/30 text-encre hover:bg-encre/5"
                : "border-encre bg-encre text-ivoire hover:bg-encre-light"
            }`}
          >
            {tenant.relancesActivees ? t("relancesDesactiver") : t("relancesActiver")}
          </button>
        </form>
      </div>

      <div className="mt-8 rounded-sm border border-encre/20 bg-white/40 p-6">
        <h2 className="font-titre text-lg text-encre">{t("totpTitre")}</h2>
        <p className="mt-1 font-sans text-sm text-encre/70">{t("totpDescription")}</p>
        <TotpSection totpEnabled={utilisateur.totpEnabled} />
      </div>

      <div className="mt-8 rounded-sm border border-encre/20 bg-white/40 p-6">
        <h2 className="font-titre text-lg text-encre">{t("journalAuditTitre")}</h2>
        <p className="mt-1 font-sans text-sm text-encre/70">{t("journalAuditDescription")}</p>
        {journalAudit.length === 0 ? (
          <p className="mt-4 font-sans text-sm text-encre/75">{t("journalAuditVide")}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse font-sans text-sm">
              <thead>
                <tr className="border-b border-encre/20 text-left text-encre/75">
                  <th className="py-2 font-medium">{t("journalAuditColDate")}</th>
                  <th className="py-2 font-medium">{t("journalAuditColAction")}</th>
                  <th className="py-2 font-medium">{t("journalAuditColUtilisateur")}</th>
                </tr>
              </thead>
              <tbody>
                {journalAudit.map((entree) => (
                  <tr key={entree.id} className="border-b border-encre/10">
                    <td className="py-2 font-mono text-xs text-encre/70">
                      {formatDate(entree.createdAt, locale, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="py-2 text-encre/80">
                      {t.has(`journalAuditActions.${entree.action}`)
                        ? t(`journalAuditActions.${entree.action}` as never)
                        : entree.action}
                    </td>
                    <td className="py-2 text-encre/70">
                      {entree.user
                        ? `${entree.user.prenom} ${entree.user.nom}`
                        : t("journalAuditUtilisateurSysteme")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8 rounded-sm border border-red-200 bg-red-50/40 p-6">
        <h2 className="font-titre text-lg text-red-800">{t("zoneDangereuse")}</h2>
        <p className="mt-1 font-sans text-sm text-red-700">
          {t("zoneDangereuseDescription")}
        </p>
        <SupprimerCompteForm />
      </div>
    </div>
  );
}
