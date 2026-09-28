import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentFiltres } from "@/components/documents/document-filtres";
import { construireWhereDocuments, construireOrderByDocuments } from "@/lib/documents/filtres";
import { nomAffichageClientSnapshot } from "@/lib/documents/snapshot";
import type { ClientSnapshot } from "@/lib/documents/snapshot";

const STATUTS_DISPONIBLES = ["brouillon", "envoye", "converti"] as const;

export default async function BonsCommandePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; statut?: string; depuis?: string; jusqua?: string; tri?: string; ordre?: string }>;
}) {
  const { q, statut, depuis, jusqua, tri, ordre } = await searchParams;
  const session = await requireSession();
  const t = await getTranslations("app.bonsCommande");
  const bons = await prisma.document.findMany({
    where: construireWhereDocuments(session.tenantId, "bon_commande", { q, statut, depuis, jusqua }),
    orderBy: construireOrderByDocuments(tri, ordre),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">{t("titre")}</h1>
        <Link
          href="/bons-commande/nouveau"
          className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
        >
          {t("nouveauBouton")}
        </Link>
      </div>

      <DocumentFiltres
        q={q}
        statut={statut}
        depuis={depuis}
        jusqua={jusqua}
        statutsDisponibles={[...STATUTS_DISPONIBLES]}
      />

      <DocumentList
        basePath="/bons-commande"
        emptyLabel={q || statut || depuis || jusqua ? t("emptyFiltre") : t("emptyDefault")}
        q={q}
        statut={statut}
        depuis={depuis}
        jusqua={jusqua}
        tri={tri}
        ordre={ordre}
        rows={bons.map((d) => ({
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
