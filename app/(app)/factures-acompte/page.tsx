import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentFiltres } from "@/components/documents/document-filtres";
import { construireWhereDocuments, construireOrderByDocuments } from "@/lib/documents/filtres";
import { nomAffichageClientSnapshot } from "@/lib/documents/snapshot";
import type { ClientSnapshot } from "@/lib/documents/snapshot";

const STATUTS_DISPONIBLES = ["brouillon", "envoye", "payee"] as const;

export default async function FacturesAcomptePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    statut?: string;
    depuis?: string;
    jusqua?: string;
    tri?: string;
    ordre?: string;
    enRetard?: string;
  }>;
}) {
  const { q, statut, depuis, jusqua, tri, ordre, enRetard } = await searchParams;
  const session = await requireSession();
  const t = await getTranslations("app.facturesAcompte");
  const ta = await getTranslations("app.documentActions");
  const where = construireWhereDocuments(session.tenantId, "facture_acompte", { q, statut, depuis, jusqua });
  if (enRetard === "1") {
    where.statut = "envoye";
    where.dateEcheance = { lt: new Date() };
  }
  const factures = await prisma.document.findMany({
    where,
    orderBy: construireOrderByDocuments(tri, ordre),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">{t("titre")}</h1>
        <Link
          href="/factures-acompte/nouveau"
          className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
        >
          {t("nouveauBouton")}
        </Link>
      </div>

      {enRetard === "1" && (
        <p className="mt-4 rounded-sm bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
          {t("enRetardBanner")}{" "}
          <a href="/factures-acompte" className="underline">
            {ta("voirToutesAcompte")}
          </a>
        </p>
      )}

      <DocumentFiltres
        q={q}
        statut={statut}
        depuis={depuis}
        jusqua={jusqua}
        statutsDisponibles={[...STATUTS_DISPONIBLES]}
      />

      <DocumentList
        basePath="/factures-acompte"
        emptyLabel={q || statut || depuis || jusqua ? t("emptyFiltre") : t("emptyDefault")}
        q={q}
        statut={statut}
        depuis={depuis}
        jusqua={jusqua}
        tri={tri}
        ordre={ordre}
        rows={factures.map((d) => ({
          id: d.id,
          numero: d.numero,
          statut: d.statut,
          dateEmission: d.dateEmission,
          clientLabel: nomAffichageClientSnapshot(d.clientSnapshot as unknown as ClientSnapshot),
          montantTtc: d.montantTtc.toString(),
        }))}
      />
    </div>
  );
}
