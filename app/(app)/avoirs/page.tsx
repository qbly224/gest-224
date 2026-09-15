import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentList } from "@/components/documents/document-list";
import { nomAffichageClientSnapshot } from "@/lib/documents/snapshot";
import type { ClientSnapshot } from "@/lib/documents/snapshot";

export default async function AvoirsPage() {
  const session = await requireSession();
  const avoirs = await prisma.document.findMany({
    where: { tenantId: session.tenantId, type: "facture_avoir" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">Avoirs</h1>
      <p className="mt-1 font-sans text-sm text-encre/70">
        Un avoir se crée depuis la fiche d&apos;une facture déjà émise
        (bouton « Créer un avoir »).
      </p>

      <DocumentList
        basePath="/avoirs"
        emptyLabel="Aucun avoir pour l'instant."
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
