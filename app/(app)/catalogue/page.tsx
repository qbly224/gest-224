import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toggleArticleActif } from "@/lib/actions/articles";

export default async function CataloguePage() {
  const session = await requireSession();
  const t = await getTranslations("app.catalogue");
  const tCommun = await getTranslations("commun");
  const [tenant, articles] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({
      where: { id: session.tenantId },
      select: { regimeTva: true },
    }),
    prisma.article.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">{t("titre")}</h1>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/catalogue"
            className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
          >
            {tCommun("exporterCsv")}
          </a>
          <Link
            href="/catalogue/nouveau"
            className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
          >
            {t("nouveauBouton")}
          </Link>
        </div>
      </div>

      {articles.length === 0 ? (
        <p className="mt-8 font-sans text-sm text-encre/75">{t("emptyDefault")}</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse font-sans text-sm">
          <thead>
            <tr className="border-b border-encre/20 text-left text-encre/75">
              <th className="py-2 font-medium">{t("colDesignation")}</th>
              <th className="py-2 font-medium">{t("colPrixHt")}</th>
              {tenant.regimeTva === "normal" && (
                <th className="py-2 font-medium">{t("colTva")}</th>
              )}
              <th className="py-2 font-medium">{t("colStatut")}</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.id} className="border-b border-encre/10">
                <td className="py-3">
                  <Link
                    href={`/catalogue/${article.id}`}
                    className="text-encre hover:underline"
                  >
                    {article.designation}
                  </Link>
                </td>
                <td className="py-3 font-mono text-encre/70">
                  {article.prixUnitaireHt.toString()} €
                </td>
                {tenant.regimeTva === "normal" && (
                  <td className="py-3 font-mono text-encre/70">
                    {article.tauxTva ? `${article.tauxTva.toString()} %` : "-"}
                  </td>
                )}
                <td className="py-3">
                  <span
                    className={
                      article.actif
                        ? "font-mono text-xs text-encre"
                        : "font-mono text-xs text-encre/70"
                    }
                  >
                    {article.actif ? t("actif") : t("desactive")}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <form action={toggleArticleActif.bind(null, article.id)}>
                    <button
                      type="submit"
                      className="font-sans text-xs text-encre/75 hover:text-encre hover:underline"
                    >
                      {article.actif ? t("desactiver") : t("reactiver")}
                    </button>
                  </form>
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
