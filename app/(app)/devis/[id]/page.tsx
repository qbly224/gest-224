import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  envoyerDevis,
  accepterDevis,
  refuserDevis,
  convertirDevisEnFacture,
  convertirDevisEnBonCommande,
} from "@/lib/actions/documents";
import { DocumentDetail } from "@/components/documents/document-detail";
import { PdfActions } from "@/components/documents/pdf-actions";
import { EnvoyerActions } from "@/components/documents/envoyer-actions";
import type { ClientSnapshot, EmetteurSnapshot } from "@/lib/documents/snapshot";

export default async function DevisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const devis = await prisma.document.findFirst({
    where: { id, tenantId: session.tenantId, type: "devis" },
    include: {
      lignes: { orderBy: { ordre: "asc" } },
      documentsAval: {
        where: { type: { in: ["facture", "bon_commande"] } },
        select: { id: true, numero: true, type: true },
      },
    },
  });
  if (!devis) notFound();

  const client = devis.clientSnapshot as unknown as ClientSnapshot;
  const emetteur = devis.emetteurSnapshot as unknown as EmetteurSnapshot;

  return (
    <DocumentDetail
      titre="Devis"
      document={devis}
      actions={
        <>
          <PdfActions documentId={devis.id} numero={devis.numero} />
          {devis.statut === "brouillon" && (
            <>
              <Link
                href={`/devis/${devis.id}/modifier`}
                className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
              >
                Modifier
              </Link>
              <EnvoyerActions
                envoyerAction={envoyerDevis.bind(null, devis.id)}
                numero={devis.numero}
                titre="Devis"
                montantTtc={Number(devis.montantTtc)}
                clientEmail={client.email}
                clientTelephone={client.telephone}
                raisonSociale={emetteur.raisonSociale}
              />
            </>
          )}
          {devis.statut === "envoye" && (
            <>
              <form action={refuserDevis.bind(null, devis.id)}>
                <button
                  type="submit"
                  className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
                >
                  Marquer refusé
                </button>
              </form>
              <form action={accepterDevis.bind(null, devis.id)}>
                <button
                  type="submit"
                  className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
                >
                  Marquer accepté
                </button>
              </form>
            </>
          )}
          {devis.statut === "accepte" && (
            <>
              <form action={convertirDevisEnBonCommande.bind(null, devis.id)}>
                <button
                  type="submit"
                  className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
                >
                  Convertir en bon de commande
                </button>
              </form>
              <form action={convertirDevisEnFacture.bind(null, devis.id)}>
                <button
                  type="submit"
                  className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
                >
                  Convertir en facture
                </button>
              </form>
            </>
          )}
        </>
      }
      aval={
        devis.documentsAval.length > 0 ? (
          <p className="mt-4 font-sans text-sm text-encre/70">
            Converti en{" "}
            {devis.documentsAval.map((d) => (
              <Link
                key={d.id}
                href={`${d.type === "facture" ? "/factures" : "/bons-commande"}/${d.id}`}
                className="font-mono underline"
              >
                {d.numero}
              </Link>
            ))}
          </p>
        ) : null
      }
    />
  );
}
