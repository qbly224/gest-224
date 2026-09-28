import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculerSoldeEtVueMensuelle } from "@/lib/comptabilite/agregats";
import {
  compterDocumentsMoisCourant,
  documentsParMoisRecents,
  croissanceClientsRecente,
} from "@/lib/documents/usage";
import { OnboardingChecklist } from "@/components/app/onboarding-checklist";
import { GraphiqueMensuel } from "@/components/dashboard/graphique-mensuel";
import { MiniBarres, MiniLigne, MiniDonut, BarreProgression } from "@/components/dashboard/mini-charts";
import { PLANS } from "@/lib/plans";
import { formatEuros } from "@/lib/format";
import { obtenirLocale } from "@/i18n/request";

const COULEUR_DOCUMENTS = "#2a78d6";
const COULEUR_CLIENTS = "#1baf7a";
const COULEUR_CATALOGUE = "#4a3aa7";
const COULEUR_SOLDE_POSITIF = "#0ca30c";
const COULEUR_SOLDE_NEGATIF = "#d03b3b";

export default async function TableauDeBordPage({
  searchParams,
}: {
  searchParams: Promise<{ erreurPaiement?: string }>;
}) {
  const session = await requireSession();
  const { erreurPaiement } = await searchParams;
  const locale = await obtenirLocale();
  const t = await getTranslations("app.dashboard");
  const tOnboarding = await getTranslations("app.onboarding");

  const [
    tenant,
    nbClients,
    nbClientsTotal,
    nbArticles,
    nbArticlesTotal,
    nbDocuments,
    nbDocumentsCeMois,
    compta,
    documentsParMois,
    croissanceClients,
    nbFacturesEnRetard,
    nbFacturesAcompteEnRetard,
  ] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId } }),
    prisma.client.count({ where: { tenantId: session.tenantId, actif: true } }),
    prisma.client.count({ where: { tenantId: session.tenantId } }),
    prisma.article.count({ where: { tenantId: session.tenantId, actif: true } }),
    prisma.article.count({ where: { tenantId: session.tenantId } }),
    prisma.document.count({ where: { tenantId: session.tenantId } }),
    compterDocumentsMoisCourant(session.tenantId),
    calculerSoldeEtVueMensuelle(session.tenantId, 6, locale),
    documentsParMoisRecents(session.tenantId),
    croissanceClientsRecente(session.tenantId),
    prisma.document.count({
      where: {
        tenantId: session.tenantId,
        type: "facture",
        statut: "envoye",
        dateEcheance: { lt: new Date() },
      },
    }),
    prisma.document.count({
      where: {
        tenantId: session.tenantId,
        type: "facture_acompte",
        statut: "envoye",
        dateEcheance: { lt: new Date() },
      },
    }),
  ]);
  const plan = PLANS[tenant.plan];
  const soldeMensuel = compta.mois.map((m) => m.solde);
  const couleurSolde = compta.solde >= 0 ? COULEUR_SOLDE_POSITIF : COULEUR_SOLDE_NEGATIF;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-titre text-2xl text-encre">{t("titre")}</h1>
        <p className="mt-1 font-sans text-sm text-encre/70">
          {tenant.raisonSociale} — {t("regimeLabel")}{" "}
          {tenant.regimeTva === "franchise" ? t("regimeFranchise") : t("regimeNormal")}
        </p>
      </div>

      {(nbFacturesEnRetard > 0 || nbFacturesAcompteEnRetard > 0) && (
        <p className="rounded-sm bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
          {nbFacturesEnRetard > 0 && (
            <>
              {nbFacturesEnRetard}{" "}
              {nbFacturesEnRetard > 1 ? t("facturesEnRetard") : t("factureEnRetard")}{" "}
              <Link href="/factures?enRetard=1" className="underline">
                {t("voir")}
              </Link>
              {nbFacturesAcompteEnRetard > 0 && " · "}
            </>
          )}
          {nbFacturesAcompteEnRetard > 0 && (
            <>
              {nbFacturesAcompteEnRetard}{" "}
              {nbFacturesAcompteEnRetard > 1
                ? t("facturesAcompteEnRetard")
                : t("factureAcompteEnRetard")}{" "}
              <Link href="/factures-acompte?enRetard=1" className="underline">
                {t("voir")}
              </Link>
            </>
          )}
        </p>
      )}

      {erreurPaiement === "1" && (
        <p className="rounded-sm bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
          {t("erreurPaiement")}{" "}
          <Link href="/abonnement" className="underline">
            {t("abonnement")}
          </Link>
          .
        </p>
      )}

      {!tenant.onboardingMasque && (
        <OnboardingChecklist
          etapes={[
            {
              label: tOnboarding("etapeIban"),
              fait: Boolean(tenant.iban),
              href: "/entreprise",
            },
            { label: tOnboarding("etapeClient"), fait: nbClients > 0, href: "/clients/nouveau" },
            {
              label: tOnboarding("etapeArticle"),
              fait: nbArticles > 0,
              href: "/catalogue/nouveau",
            },
            { label: tOnboarding("etapeDevis"), fait: nbDocuments > 0, href: "/devis/nouveau" },
          ]}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-sm border border-encre/20 bg-white/40 p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-sans text-sm text-encre/60">{t("soldeGlobal")}</p>
              <p
                className="mt-1 font-mono text-2xl"
                style={{ color: couleurSolde }}
              >
                {formatEuros(compta.solde, locale)}
              </p>
            </div>
            <MiniLigne valeurs={soldeMensuel} couleur={couleurSolde} />
          </div>
        </div>

        <div className="rounded-sm border border-encre/20 bg-white/40 p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-sans text-sm text-encre/60">{t("documentsCeMois")}</p>
              <p className="mt-1 font-mono text-2xl text-encre">
                {nbDocumentsCeMois}
                {plan.limiteDocumentsParMois !== null && (
                  <span className="text-encre/40"> / {plan.limiteDocumentsParMois}</span>
                )}
              </p>
            </div>
            <MiniBarres valeurs={documentsParMois} couleur={COULEUR_DOCUMENTS} />
          </div>
          {plan.limiteDocumentsParMois !== null && (
            <div className="mt-4">
              <BarreProgression
                fraction={nbDocumentsCeMois / plan.limiteDocumentsParMois}
                couleur={COULEUR_DOCUMENTS}
              />
            </div>
          )}
        </div>

        <div className="rounded-sm border border-encre/20 bg-white/40 p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-sans text-sm text-encre/60">{t("clientsActifs")}</p>
              <p className="mt-1 font-mono text-2xl text-encre">
                {nbClients}
                {plan.limiteClients !== null && (
                  <span className="text-encre/40"> / {plan.limiteClients}</span>
                )}
              </p>
            </div>
            <MiniLigne valeurs={croissanceClients} couleur={COULEUR_CLIENTS} />
          </div>
          {plan.limiteClients !== null && (
            <div className="mt-4">
              <BarreProgression
                fraction={nbClientsTotal / plan.limiteClients}
                couleur={COULEUR_CLIENTS}
              />
            </div>
          )}
        </div>

        <div className="rounded-sm border border-encre/20 bg-white/40 p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-sans text-sm text-encre/60">{t("catalogue")}</p>
              <p className="mt-1 font-mono text-2xl text-encre">{nbArticles}</p>
              <p className="mt-0.5 font-sans text-xs text-encre/50">
                {t("surTotal", { total: nbArticlesTotal })}
              </p>
            </div>
            <MiniDonut valeur={nbArticles} total={Math.max(nbArticlesTotal, 1)} couleur={COULEUR_CATALOGUE} />
          </div>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-titre text-lg text-encre">{t("vueMensuelle")}</h2>
          <div className="flex flex-wrap gap-4 font-sans text-sm">
            <Link href="/recettes" className="text-encre underline">
              {t("recettes")}
            </Link>
            <Link href="/depenses" className="text-encre underline">
              {t("depenses")}
            </Link>
            <Link href="/rapport" className="text-encre underline">
              {t("rapportComplet")}
            </Link>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-sm border border-encre/20 bg-white/40 p-4 sm:p-6">
          <GraphiqueMensuel mois={compta.mois} />
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-encre/20 text-left text-encre/60">
                <th className="py-2 font-medium">{t("colMois")}</th>
                <th className="py-2 text-right font-medium">{t("colRecettes")}</th>
                <th className="py-2 text-right font-medium">{t("colDepenses")}</th>
                <th className="py-2 text-right font-medium">{t("colSolde")}</th>
              </tr>
            </thead>
            <tbody>
              {compta.mois.map((m) => (
                <tr key={m.mois} className="border-b border-encre/10">
                  <td className="py-2 capitalize text-encre">{m.label}</td>
                  <td className="py-2 text-right font-mono text-encre/80">
                    {formatEuros(m.recettes, locale)}
                  </td>
                  <td className="py-2 text-right font-mono text-encre/80">
                    {formatEuros(m.depenses, locale)}
                  </td>
                  <td
                    className={`py-2 text-right font-mono ${m.solde >= 0 ? "text-encre" : "text-red-700"}`}
                  >
                    {formatEuros(m.solde, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
