import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  envoyerDevis,
  accepterDevis,
  refuserDevis,
  convertirDevisEnFacture,
  convertirDevisEnBonCommande,
  dupliquerDocument,
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
  const t = await getTranslations("app.devis");
  const ta = await getTranslations("app.documentActions");

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
      titre={t("titreSingulier")}
      document={devis}
      actions={
        <>
          <PdfActions documentId={devis.id} numero={devis.numero} />
          <form action={dupliquerDocument.bind(null, devis.id)}>
            <button
              type="submit"
              className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
            >
              {ta("dupliquer")}
            </button>
          </form>
          {devis.statut === "brouillon" && (
            <>
              <Link
                href={`/devis/${devis.id}/modifier`}
                className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
              >
                {ta("modifier")}
              </Link>
              <EnvoyerActions
                envoyerAction={envoyerDevis.bind(null, devis.id)}
                numero={devis.numero}
                titre={t("titreSingulier")}
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
                  {ta("marquerRefuse")}
                </button>
              </form>
              <form action={accepterDevis.bind(null, devis.id)}>
                <button
                  type="submit"
                  className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
                >
                  {ta("marquerAccepte")}
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
                  {ta("convertirBonCommande")}
                </button>
              </form>
              <form action={convertirDevisEnFacture.bind(null, devis.id)}>
                <button
                  type="submit"
                  className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
                >
                  {ta("convertirFacture")}
                </button>
              </form>
            </>
          )}
        </>
      }
      aval={
        devis.documentsAval.length > 0 ? (
          <p className="mt-4 font-sans text-sm text-encre/70">
            {t("convertiEn")}{" "}
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
