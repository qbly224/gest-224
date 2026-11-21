import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { exigerAcces } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { supprimerAnnonce } from "@/lib/actions/annonces";
import { BoutonSupprimer } from "@/components/forms/bouton-supprimer";
import { formatDate } from "@/lib/format";
import { withToast } from "@/lib/toast";
import type { Locale } from "@/i18n/config";

export default async function AnnoncesPage() {
  const session = await requireSession();
  exigerAcces(session.role, "annonces");
  const t = await getTranslations("app.annonces");
  const locale = (await getLocale()) as Locale;

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: session.tenantId },
    select: { typeCompte: true },
  });
  if (tenant.typeCompte !== "association") {
    redirect(withToast("/tableau-de-bord", "Cette fonctionnalité est réservée aux associations."));
  }

  const annonces = await prisma.annonce.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">{t("titre")}</h1>
        <Link
          href="/annonces/nouveau"
          className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
        >
          {t("nouveauBouton")}
        </Link>
      </div>

      {annonces.length === 0 ? (
        <p className="mt-8 font-sans text-sm text-encre/75">{t("emptyDefault")}</p>
      ) : (
        <ul className="mt-6 divide-y divide-encre/10">
          {annonces.map((annonce) => (
            <li key={annonce.id} className="py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-titre text-base text-encre">{annonce.titre}</h2>
                  <p className="mt-0.5 font-mono text-xs text-encre/60">
                    {formatDate(annonce.createdAt, locale, { dateStyle: "long", timeStyle: "short" })}
                  </p>
                </div>
                <form action={supprimerAnnonce.bind(null, annonce.id)}>
                  <BoutonSupprimer confirmMessage={t("confirmSuppression")} />
                </form>
              </div>
              <p className="mt-2 whitespace-pre-wrap font-sans text-sm text-encre/80">
                {annonce.contenu}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
