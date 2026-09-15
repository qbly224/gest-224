import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { envoyerFactureAcompte } from "@/lib/actions/documents";
import { DocumentDetail } from "@/components/documents/document-detail";
import { PdfLink } from "@/components/documents/pdf-link";

export default async function FactureAcompteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const facture = await prisma.document.findFirst({
    where: { id, tenantId: session.tenantId, type: "facture_acompte" },
    include: { lignes: { orderBy: { ordre: "asc" } } },
  });
  if (!facture) notFound();

  return (
    <DocumentDetail
      titre="Facture d'acompte"
      document={facture}
      afficherPaiement
      actions={
        <>
          <PdfLink documentId={facture.id} />
          {facture.statut === "brouillon" && (
            <>
              <Link
                href={`/factures-acompte/${facture.id}/modifier`}
                className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
              >
                Modifier
              </Link>
              <form action={envoyerFactureAcompte.bind(null, facture.id)}>
                <button
                  type="submit"
                  className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
                >
                  Envoyer
                </button>
              </form>
            </>
          )}
        </>
      }
    />
  );
}
