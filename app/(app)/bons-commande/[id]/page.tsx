import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { envoyerBonCommande, convertirBonCommandeEnBonLivraison } from "@/lib/actions/documents";
import { DocumentDetail } from "@/components/documents/document-detail";
import { PdfActions } from "@/components/documents/pdf-actions";
import { EnvoyerActions } from "@/components/documents/envoyer-actions";
import type { ClientSnapshot, EmetteurSnapshot } from "@/lib/documents/snapshot";

export default async function BonCommandeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const bonCommande = await prisma.document.findFirst({
    where: { id, tenantId: session.tenantId, type: "bon_commande" },
    include: {
      lignes: { orderBy: { ordre: "asc" } },
      refDocument: { select: { id: true, numero: true } },
      documentsAval: { where: { type: "bon_livraison" }, select: { id: true, numero: true } },
    },
  });
  if (!bonCommande) notFound();

  const client = bonCommande.clientSnapshot as unknown as ClientSnapshot;
  const emetteur = bonCommande.emetteurSnapshot as unknown as EmetteurSnapshot;

  return (
    <DocumentDetail
      titre="Bon de commande"
      document={bonCommande}
      reference={
        bonCommande.refDocument && (
          <p className="mt-1 font-sans text-xs italic text-encre/60">
            Établi suite au devis{" "}
            <Link href={`/devis/${bonCommande.refDocument.id}`} className="font-mono underline">
              {bonCommande.refDocument.numero}
            </Link>
          </p>
        )
      }
      aval={
        bonCommande.documentsAval.length > 0 ? (
          <p className="mt-4 font-sans text-sm text-encre/70">
            Converti en bon de livraison{" "}
            {bonCommande.documentsAval.map((d) => (
              <Link key={d.id} href={`/bons-livraison/${d.id}`} className="font-mono underline">
                {d.numero}
              </Link>
            ))}
          </p>
        ) : null
      }
      actions={
        <>
          <PdfActions documentId={bonCommande.id} numero={bonCommande.numero} />
          {bonCommande.statut === "brouillon" && (
            <>
              <Link
                href={`/bons-commande/${bonCommande.id}/modifier`}
                className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
              >
                Modifier
              </Link>
              <EnvoyerActions
                envoyerAction={envoyerBonCommande.bind(null, bonCommande.id)}
                numero={bonCommande.numero}
                titre="Bon de commande"
                montantTtc={Number(bonCommande.montantTtc)}
                clientEmail={client.email}
                clientTelephone={client.telephone}
                raisonSociale={emetteur.raisonSociale}
              />
            </>
          )}
          {bonCommande.statut === "envoye" && (
            <form action={convertirBonCommandeEnBonLivraison.bind(null, bonCommande.id)}>
              <button
                type="submit"
                className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
              >
                Convertir en bon de livraison
              </button>
            </form>
          )}
        </>
      }
    />
  );
}
