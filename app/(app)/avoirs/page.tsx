import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentFiltres } from "@/components/documents/document-filtres";
import { construireWhereDocuments } from "@/lib/documents/filtres";
import { nomAffichageClientSnapshot } from "@/lib/documents/snapshot";
import type { ClientSnapshot } from "@/lib/documents/snapshot";

const STATUTS_DISPONIBLES = ["brouillon", "envoye"] as const;

export default async function AvoirsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; statut?: string }>;
}) {
  const { q, statut } = await searchParams;
  const session = await requireSession();
  const avoirs = await prisma.document.findMany({
    where: construireWhereDocuments(session.tenantId, "facture_avoir", { q, statut }),
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">Avoirs</h1>
      <p className="mt-1 font-sans text-sm text-encre/70">
        Un avoir se crée depuis la fiche d&apos;une facture déjà émise
        (bouton « Créer un avoir »).
      </p>

      <DocumentFiltres q={q} statut={statut} statutsDisponibles={[...STATUTS_DISPONIBLES]} />

      <DocumentList
        basePath="/avoirs"
        emptyLabel={
          q || statut ? "Aucun avoir ne correspond à ces critères." : "Aucun avoir pour l'instant."
        }
        montantLabel="Montant à déduire"
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
