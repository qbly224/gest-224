import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { envoyerFactureAcompte, dupliquerDocument } from "@/lib/actions/documents";
import { marquerDocumentPaye } from "@/lib/actions/comptabilite";
import { DocumentDetail } from "@/components/documents/document-detail";
import { PdfActions } from "@/components/documents/pdf-actions";
import { EnvoyerActions } from "@/components/documents/envoyer-actions";
import type { ClientSnapshot, EmetteurSnapshot } from "@/lib/documents/snapshot";

export default async function FactureAcompteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const t = await getTranslations("app.facturesAcompte");
  const ta = await getTranslations("app.documentActions");

  const facture = await prisma.document.findFirst({
    where: { id, tenantId: session.tenantId, type: "facture_acompte" },
    include: { lignes: { orderBy: { ordre: "asc" } } },
  });
  if (!facture) notFound();

  const client = facture.clientSnapshot as unknown as ClientSnapshot;
  const emetteur = facture.emetteurSnapshot as unknown as EmetteurSnapshot;

  return (
    <DocumentDetail
      titre={t("titreSingulier")}
      document={facture}
      afficherPaiement
      actions={
        <>
          <PdfActions documentId={facture.id} numero={facture.numero} avecFacturX />
          <form action={dupliquerDocument.bind(null, facture.id)}>
            <button
              type="submit"
              className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
            >
              {ta("dupliquer")}
            </button>
          </form>
          {facture.statut === "brouillon" && (
            <>
              <Link
                href={`/factures-acompte/${facture.id}/modifier`}
                className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
              >
                {ta("modifier")}
              </Link>
              <EnvoyerActions
                envoyerAction={envoyerFactureAcompte.bind(null, facture.id)}
                numero={facture.numero}
                titre={t("titreSingulier")}
                montantTtc={Number(facture.montantTtc)}
                clientEmail={client.email}
                clientTelephone={client.telephone}
                raisonSociale={emetteur.raisonSociale}
              />
            </>
          )}
          {facture.statut === "envoye" && (
            <form action={marquerDocumentPaye.bind(null, facture.id)}>
              <button
                type="submit"
                className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
              >
                {ta("marquerPayee")}
              </button>
            </form>
          )}
        </>
      }
    />
  );
}
