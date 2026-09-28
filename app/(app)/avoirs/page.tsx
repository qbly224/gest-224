import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentFiltres } from "@/components/documents/document-filtres";
import { construireWhereDocuments, construireOrderByDocuments } from "@/lib/documents/filtres";
import { nomAffichageClientSnapshot } from "@/lib/documents/snapshot";
import type { ClientSnapshot } from "@/lib/documents/snapshot";

const STATUTS_DISPONIBLES = ["brouillon", "envoye"] as const;

export default async function AvoirsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; statut?: string; depuis?: string; jusqua?: string; tri?: string; ordre?: string }>;
}) {
  const { q, statut, depuis, jusqua, tri, ordre } = await searchParams;
  const session = await requireSession();
  const t = await getTranslations("app.avoirs");
  const avoirs = await prisma.document.findMany({
    where: construireWhereDocuments(session.tenantId, "facture_avoir", { q, statut, depuis, jusqua }),
    orderBy: construireOrderByDocuments(tri, ordre),
  });

  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">{t("titre")}</h1>
      <p className="mt-1 font-sans text-sm text-encre/70">{t("intro")}</p>

      <DocumentFiltres
        q={q}
        statut={statut}
        depuis={depuis}
        jusqua={jusqua}
        statutsDisponibles={[...STATUTS_DISPONIBLES]}
      />

      <DocumentList
        basePath="/avoirs"
        emptyLabel={q || statut || depuis || jusqua ? t("emptyFiltre") : t("emptyDefault")}
        montantLabel={t("montantADeduire")}
        q={q}
        statut={statut}
        depuis={depuis}
        jusqua={jusqua}
        tri={tri}
        ordre={ordre}
        rows={avoirs.map((d) => ({
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
