import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { exigerAcces } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { supprimerDocumentAssociatif } from "@/lib/actions/documents-associatifs";
import { BoutonSupprimer } from "@/components/forms/bouton-supprimer";
import { formatDate } from "@/lib/format";
import { withToast } from "@/lib/toast";
import type { Locale } from "@/i18n/config";
import type { CategorieDocumentAssociatif } from "@prisma/client";

const CATEGORIES: CategorieDocumentAssociatif[] = [
  "statuts",
  "reglement_interieur",
  "proces_verbal",
  "rapport_activite",
  "administratif",
  "autre",
];

function formatTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string }>;
}) {
  const { categorie } = await searchParams;
  const session = await requireSession();
  exigerAcces(session.role, "documents");
  const t = await getTranslations("app.documents");
  const locale = (await getLocale()) as Locale;

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: session.tenantId },
    select: { typeCompte: true },
  });
  if (tenant.typeCompte !== "association") {
    redirect(withToast("/tableau-de-bord", "Cette fonctionnalité est réservée aux associations."));
  }

  const categorieValide = CATEGORIES.includes(categorie as CategorieDocumentAssociatif)
    ? (categorie as CategorieDocumentAssociatif)
    : undefined;

  const documents = await prisma.documentAssociatif.findMany({
    where: { tenantId: session.tenantId, ...(categorieValide ? { categorie: categorieValide } : {}) },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">{t("titre")}</h1>
        <Link
          href="/documents/nouveau"
          className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
        >
          {t("nouveauBouton")}
        </Link>
      </div>

      <form className="mt-4 flex flex-wrap items-center gap-2" method="get">
        <select
          name="categorie"
          aria-label={t("categorie")}
          defaultValue={categorieValide ?? ""}
          className="rounded-sm border border-encre/30 bg-ivoire px-3 py-2 font-sans text-sm text-encre focus:border-encre focus:outline-none"
        >
          <option value="">{t("tousCategories")}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(`categories.${c}`)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
        >
          {t("filtrer")}
        </button>
        {categorieValide && (
          <a href="?" className="font-sans text-xs text-encre/75 underline">
            {t("reinitialiser")}
          </a>
        )}
      </form>

      {documents.length === 0 ? (
        <p className="mt-8 font-sans text-sm text-encre/75">{t("emptyDefault")}</p>
      ) : (
        <ul className="mt-6 divide-y divide-encre/10">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0 flex-1">
                <a
                  href={`/api/documents-association/${doc.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate font-sans text-sm text-encre hover:underline"
                >
                  {doc.titre}
                </a>
                <p className="mt-0.5 font-mono text-xs text-encre/60">
                  {t(`categories.${doc.categorie}`)} · {formatTaille(doc.tailleOctets)} ·{" "}
                  {formatDate(doc.createdAt, locale)}
                </p>
              </div>
              <a
                href={`/api/documents-association/${doc.id}?telecharger=1`}
                className="shrink-0 font-sans text-xs text-encre/75 hover:text-encre hover:underline"
              >
                {t("telecharger")}
              </a>
              <form action={supprimerDocumentAssociatif.bind(null, doc.id)} className="shrink-0">
                <BoutonSupprimer confirmMessage={t("confirmSuppression")} />
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
