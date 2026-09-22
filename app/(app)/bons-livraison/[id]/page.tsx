import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  envoyerBonLivraison,
  marquerBonLivraisonLivre,
  convertirBonLivraisonEnFacture,
} from "@/lib/actions/documents";
import { DocumentDetail } from "@/components/documents/document-detail";
import { PdfActions } from "@/components/documents/pdf-actions";
import { EnvoyerActions } from "@/components/documents/envoyer-actions";
import type { ClientSnapshot, EmetteurSnapshot } from "@/lib/documents/snapshot";

export default async function BonLivraisonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const bonLivraison = await prisma.document.findFirst({
    where: { id, tenantId: session.tenantId, type: "bon_livraison" },
    include: {
      lignes: { orderBy: { ordre: "asc" } },
      refDocument: { select: { id: true, numero: true } },
      documentsAval: { where: { type: "facture" }, select: { id: true, numero: true } },
    },
  });
  if (!bonLivraison) notFound();

  const client = bonLivraison.clientSnapshot as unknown as ClientSnapshot;
  const emetteur = bonLivraison.emetteurSnapshot as unknown as EmetteurSnapshot;

  return (
    <DocumentDetail
      titre="Bon de livraison"
      document={bonLivraison}
      masquerPrix
      reference={
        bonLivraison.refDocument && (
          <p className="mt-1 font-sans text-xs italic text-encre/60">
            Établi suite au bon de commande{" "}
            <Link
              href={`/bons-commande/${bonLivraison.refDocument.id}`}
              className="font-mono underline"
            >
              {bonLivraison.refDocument.numero}
            </Link>
          </p>
        )
      }
      aval={
        bonLivraison.documentsAval.length > 0 ? (
          <p className="mt-4 font-sans text-sm text-encre/70">
            Converti en facture{" "}
            {bonLivraison.documentsAval.map((d) => (
              <Link key={d.id} href={`/factures/${d.id}`} className="font-mono underline">
                {d.numero}
              </Link>
            ))}
          </p>
        ) : null
      }
      actions={
        <>
          <PdfActions documentId={bonLivraison.id} numero={bonLivraison.numero} />
          {bonLivraison.statut === "brouillon" && (
            <>
              <Link
                href={`/bons-livraison/${bonLivraison.id}/modifier`}
                className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
              >
                Modifier
              </Link>
              <EnvoyerActions
                envoyerAction={envoyerBonLivraison.bind(null, bonLivraison.id)}
                numero={bonLivraison.numero}
                titre="Bon de livraison"
                montantTtc={Number(bonLivraison.montantTtc)}
                clientEmail={client.email}
                clientTelephone={client.telephone}
                raisonSociale={emetteur.raisonSociale}
                masquerMontant
              />
            </>
          )}
          {bonLivraison.statut === "envoye" && (
            <form action={marquerBonLivraisonLivre.bind(null, bonLivraison.id)}>
              <button
                type="submit"
                className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
              >
                Marquer livré
              </button>
            </form>
          )}
          {bonLivraison.statut === "livre" && (
            <form action={convertirBonLivraisonEnFacture.bind(null, bonLivraison.id)}>
              <button
                type="submit"
                className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
              >
                Convertir en facture
              </button>
            </form>
          )}
        </>
      }
    />
  );
}
