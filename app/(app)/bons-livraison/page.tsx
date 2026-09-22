import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentList } from "@/components/documents/document-list";
import { nomAffichageClientSnapshot } from "@/lib/documents/snapshot";
import type { ClientSnapshot } from "@/lib/documents/snapshot";

export default async function BonsLivraisonPage() {
  const session = await requireSession();
  const bons = await prisma.document.findMany({
    where: { tenantId: session.tenantId, type: "bon_livraison" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">Bons de livraison</h1>
        <Link
          href="/bons-livraison/nouveau"
          className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
        >
          Nouveau bon de livraison
        </Link>
      </div>

      <DocumentList
        basePath="/bons-livraison"
        emptyLabel="Aucun bon de livraison pour l'instant."
        showMontant={false}
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
