import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toggleArticleActif } from "@/lib/actions/articles";

export default async function CataloguePage() {
  const session = await requireSession();
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
      <div className="flex items-center justify-between">
        <h1 className="font-titre text-2xl text-encre">
          Catalogue produits / services
        </h1>
        <Link
          href="/catalogue/nouveau"
          className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
        >
          Nouvel article
        </Link>
      </div>

      {articles.length === 0 ? (
        <p className="mt-8 font-sans text-sm text-encre/60">
          Aucun article pour l&apos;instant.
        </p>
      ) : (
        <table className="mt-6 w-full border-collapse font-sans text-sm">
          <thead>
            <tr className="border-b border-encre/20 text-left text-encre/60">
              <th className="py-2 font-medium">Désignation</th>
              <th className="py-2 font-medium">Prix HT</th>
              {tenant.regimeTva === "normal" && (
                <th className="py-2 font-medium">TVA</th>
              )}
              <th className="py-2 font-medium">Statut</th>
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
                    {article.tauxTva ? `${article.tauxTva.toString()} %` : "—"}
                  </td>
                )}
                <td className="py-3">
                  <span
                    className={
                      article.actif
                        ? "font-mono text-xs text-encre"
                        : "font-mono text-xs text-encre/40"
                    }
                  >
                    {article.actif ? "actif" : "désactivé"}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <form action={toggleArticleActif.bind(null, article.id)}>
                    <button
                      type="submit"
                      className="font-sans text-xs text-encre/60 hover:text-encre hover:underline"
                    >
                      {article.actif ? "Désactiver" : "Réactiver"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
