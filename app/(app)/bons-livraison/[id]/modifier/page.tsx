import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateBonLivraison } from "@/lib/actions/documents";
import { listerClientsOptions, listerArticlesOptions } from "@/lib/documents/options";
import { DocumentForm } from "@/components/documents/document-form";

export default async function ModifierBonLivraisonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const bonLivraison = await prisma.document.findFirst({
    where: { id, tenantId: session.tenantId, type: "bon_livraison" },
    include: { lignes: { orderBy: { ordre: "asc" } } },
  });
  if (!bonLivraison) notFound();
  if (bonLivraison.statut !== "brouillon") {
    redirect(`/bons-livraison/${bonLivraison.id}`);
  }

  const [tenant, clients, articles] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({
      where: { id: session.tenantId },
      select: { regimeTva: true },
    }),
    listerClientsOptions(session.tenantId),
    listerArticlesOptions(session.tenantId),
  ]);

  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">
        Modifier le bon de livraison {bonLivraison.numero}
      </h1>
      <DocumentForm
        type="bon_livraison"
        clients={clients}
        articles={articles}
        regimeTvaNormal={tenant.regimeTva === "normal"}
        action={updateBonLivraison.bind(null, bonLivraison.id)}
        initial={{
          clientId: bonLivraison.clientId,
          dateEmission: bonLivraison.dateEmission.toISOString().slice(0, 10),
          dateEcheance: "",
          conditionsPaiement: bonLivraison.conditionsPaiement ?? "",
          tauxPenaliteRetard: "10",
          notes: bonLivraison.notes ?? "",
          lignes: bonLivraison.lignes.map((l) => ({
            key: l.id,
            articleId: l.articleId,
            designation: l.designation,
            description: l.description ?? "",
            uniteMesure: l.uniteMesure ?? "",
            quantite: l.quantite.toString(),
            prixUnitaireHt: l.prixUnitaireHt.toString(),
            tauxTva: l.tauxTva ? Number(l.tauxTva) : null,
            remisePourcentage: l.remisePourcentage.toString(),
          })),
        }}
      />
    </div>
  );
}
