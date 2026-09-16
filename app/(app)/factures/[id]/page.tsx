import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { envoyerFacture, creerAvoirDepuisFacture } from "@/lib/actions/documents";
import { marquerDocumentPaye } from "@/lib/actions/comptabilite";
import { DocumentDetail } from "@/components/documents/document-detail";
import { PdfLink } from "@/components/documents/pdf-link";
import { TITRES_DOCUMENT } from "@/lib/documents/statut-labels";

export default async function FactureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const facture = await prisma.document.findFirst({
    where: { id, tenantId: session.tenantId, type: "facture" },
    include: {
      lignes: { orderBy: { ordre: "asc" } },
      refDocument: { select: { id: true, numero: true, type: true } },
      documentsAval: {
        where: { type: "facture_avoir" },
        select: { id: true, numero: true },
      },
    },
  });
  if (!facture) notFound();

  return (
    <DocumentDetail
      titre="Facture"
      document={facture}
      afficherPaiement
      reference={
        facture.refDocument && (
          <p className="mt-1 font-sans text-xs italic text-encre/60">
            Établie suite au{" "}
            {TITRES_DOCUMENT[facture.refDocument.type].toLowerCase()}{" "}
            <Link
              href={`${facture.refDocument.type === "devis" ? "/devis" : "/bons-livraison"}/${facture.refDocument.id}`}
              className="font-mono underline"
            >
              {facture.refDocument.numero}
            </Link>
          </p>
        )
      }
      aval={
        facture.documentsAval.length > 0 ? (
          <p className="mt-4 font-sans text-sm text-encre/70">
            Avoir(s) émis :{" "}
            {facture.documentsAval.map((a) => (
              <Link key={a.id} href={`/avoirs/${a.id}`} className="font-mono underline">
                {a.numero}
              </Link>
            ))}
          </p>
        ) : null
      }
      actions={
        <>
          <PdfLink documentId={facture.id} />
          {facture.statut === "brouillon" && (
            <>
              <Link
                href={`/factures/${facture.id}/modifier`}
                className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
              >
                Modifier
              </Link>
              <form action={envoyerFacture.bind(null, facture.id)}>
                <button
                  type="submit"
                  className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
                >
                  Envoyer
                </button>
              </form>
            </>
          )}
          {facture.statut === "envoye" && (
            <form action={marquerDocumentPaye.bind(null, facture.id)}>
              <button
                type="submit"
                className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
              >
                Marquer payée
              </button>
            </form>
          )}
          {facture.statut !== "brouillon" && (
            <form action={creerAvoirDepuisFacture.bind(null, facture.id)}>
              <button
                type="submit"
                className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
              >
                Créer un avoir
              </button>
            </form>
          )}
        </>
      }
    />
  );
}
