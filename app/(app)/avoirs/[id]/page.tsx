import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { envoyerAvoir, dupliquerDocument } from "@/lib/actions/documents";
import { DocumentDetail } from "@/components/documents/document-detail";
import { PdfActions } from "@/components/documents/pdf-actions";
import { EnvoyerActions } from "@/components/documents/envoyer-actions";
import type { ClientSnapshot, EmetteurSnapshot } from "@/lib/documents/snapshot";

export default async function AvoirDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const avoir = await prisma.document.findFirst({
    where: { id, tenantId: session.tenantId, type: "facture_avoir" },
    include: {
      lignes: { orderBy: { ordre: "asc" } },
      refDocument: { select: { id: true, numero: true } },
    },
  });
  if (!avoir) notFound();

  const client = avoir.clientSnapshot as unknown as ClientSnapshot;
  const emetteur = avoir.emetteurSnapshot as unknown as EmetteurSnapshot;

  return (
    <DocumentDetail
      titre="Avoir"
      document={avoir}
      montantLabel="Montant TTC à déduire"
      reference={
        avoir.refDocument && (
          <p className="mt-1 font-sans text-xs italic text-encre/60">
            Émis suite à la facture{" "}
            <Link href={`/factures/${avoir.refDocument.id}`} className="font-mono underline">
              {avoir.refDocument.numero}
            </Link>
          </p>
        )
      }
      actions={
        <>
          <PdfActions documentId={avoir.id} numero={avoir.numero} />
          <form action={dupliquerDocument.bind(null, avoir.id)}>
            <button
              type="submit"
              className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
            >
              Dupliquer
            </button>
          </form>
          {avoir.statut === "brouillon" && (
            <>
              <Link
                href={`/avoirs/${avoir.id}/modifier`}
                className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
              >
                Modifier
              </Link>
              <EnvoyerActions
                envoyerAction={envoyerAvoir.bind(null, avoir.id)}
                numero={avoir.numero}
                titre="Avoir"
                montantTtc={Math.abs(Number(avoir.montantTtc))}
                clientEmail={client.email}
                clientTelephone={client.telephone}
                raisonSociale={emetteur.raisonSociale}
              />
            </>
          )}
        </>
      }
    />
  );
}
