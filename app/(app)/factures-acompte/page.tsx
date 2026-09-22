import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentList } from "@/components/documents/document-list";
import { nomAffichageClientSnapshot } from "@/lib/documents/snapshot";
import type { ClientSnapshot } from "@/lib/documents/snapshot";

export default async function FacturesAcomptePage() {
  const session = await requireSession();
  const factures = await prisma.document.findMany({
    where: { tenantId: session.tenantId, type: "facture_acompte" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">Factures d&apos;acompte</h1>
        <Link
          href="/factures-acompte/nouveau"
          className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
        >
          Nouvelle facture d&apos;acompte
        </Link>
      </div>

      <DocumentList
        basePath="/factures-acompte"
        emptyLabel="Aucune facture d'acompte pour l'instant."
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
