import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentFiltres } from "@/components/documents/document-filtres";
import { construireWhereDocuments } from "@/lib/documents/filtres";
import { nomAffichageClientSnapshot } from "@/lib/documents/snapshot";
import type { ClientSnapshot } from "@/lib/documents/snapshot";

const STATUTS_DISPONIBLES = ["brouillon", "envoye", "payee"] as const;

export default async function FacturesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; statut?: string }>;
}) {
  const { q, statut } = await searchParams;
  const session = await requireSession();
  const factures = await prisma.document.findMany({
    where: construireWhereDocuments(session.tenantId, "facture", { q, statut }),
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">Factures</h1>
        <Link
          href="/factures/nouveau"
          className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
        >
          Nouvelle facture
        </Link>
      </div>

      <DocumentFiltres q={q} statut={statut} statutsDisponibles={[...STATUTS_DISPONIBLES]} />

      <DocumentList
        basePath="/factures"
        emptyLabel={
          q || statut
            ? "Aucune facture ne correspond à ces critères."
            : "Aucune facture pour l'instant."
        }
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
