import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toggleFactureRecurrenteActive, supprimerFactureRecurrente } from "@/lib/actions/factures-recurrentes";
import { BoutonSupprimer } from "@/components/forms/bouton-supprimer";
import { formatEuros, formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/config";

export default async function FacturesRecurrentesPage() {
  const session = await requireSession();
  const t = await getTranslations("app.facturesRecurrentes");
  const tFrequence = await getTranslations("app.facturesRecurrentes.frequenceLabel");
  const locale = (await getLocale()) as Locale;

  const modeles = await prisma.factureRecurrente.findMany({
    where: { tenantId: session.tenantId },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">{t("titre")}</h1>
        <Link
          href="/factures-recurrentes/nouveau"
          className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
        >
          {t("nouveauBouton")}
        </Link>
      </div>
      <p className="mt-1 font-sans text-sm text-encre/70">{t("description")}</p>

      {modeles.length === 0 ? (
        <p className="mt-8 font-sans text-sm text-encre/60">{t("emptyDefault")}</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse font-sans text-sm">
          <thead>
            <tr className="border-b border-encre/20 text-left text-encre/60">
              <th className="py-2 font-medium">{t("colDesignation")}</th>
              <th className="py-2 font-medium">{t("colClient")}</th>
              <th className="py-2 font-medium">{t("colFrequence")}</th>
              <th className="py-2 font-medium">{t("colProchaine")}</th>
              <th className="py-2 text-right font-medium">{t("colMontant")}</th>
              <th className="py-2 font-medium">{t("colStatut")}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {modeles.map((m) => (
              <tr key={m.id} className="border-b border-encre/10">
                <td className="py-3">
                  <Link href={`/factures-recurrentes/${m.id}`} className="text-encre hover:underline">
                    {m.designation}
                  </Link>
                </td>
                <td className="py-3 text-encre/70">
                  {m.client.type === "professionnel"
                    ? m.client.raisonSociale
                    : `${m.client.prenom ?? ""} ${m.client.nom ?? ""}`.trim()}
                </td>
                <td className="py-3 text-encre/70">{tFrequence(m.frequence)}</td>
                <td className="py-3 font-mono text-encre/70">
                  {formatDate(m.prochaineGenerationDate, locale)}
                </td>
                <td className="py-3 text-right font-mono text-encre">
                  {formatEuros(Number(m.prixUnitaireHt) * Number(m.quantite), locale)}
                </td>
                <td className="py-3">
                  <span
                    className={
                      m.active ? "font-mono text-xs text-encre" : "font-mono text-xs text-encre/40"
                    }
                  >
                    {m.active ? t("active") : t("enPause")}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <form action={toggleFactureRecurrenteActive.bind(null, m.id)}>
                      <button
                        type="submit"
                        className="font-sans text-xs text-encre/60 hover:text-encre hover:underline"
                      >
                        {m.active ? t("mettreEnPause") : t("reactiver")}
                      </button>
                    </form>
                    <form action={supprimerFactureRecurrente.bind(null, m.id)}>
                      <BoutonSupprimer confirmMessage={t("confirmSuppression", { designation: m.designation })} />
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
