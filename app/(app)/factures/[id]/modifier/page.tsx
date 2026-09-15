import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateFacture } from "@/lib/actions/documents";
import { listerClientsOptions, listerArticlesOptions } from "@/lib/documents/options";
import { DocumentForm } from "@/components/documents/document-form";

export default async function ModifierFacturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const facture = await prisma.document.findFirst({
    where: { id, tenantId: session.tenantId, type: "facture" },
    include: { lignes: { orderBy: { ordre: "asc" } } },
  });
  if (!facture) notFound();
  if (facture.statut !== "brouillon") {
    redirect(`/factures/${facture.id}`);
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
        Modifier la facture {facture.numero}
      </h1>
      <DocumentForm
        type="facture"
        clients={clients}
        articles={articles}
        regimeTvaNormal={tenant.regimeTva === "normal"}
        action={updateFacture.bind(null, facture.id)}
        initial={{
          clientId: facture.clientId,
          dateEmission: facture.dateEmission.toISOString().slice(0, 10),
          dateEcheance: facture.dateEcheance
            ? facture.dateEcheance.toISOString().slice(0, 10)
            : "",
          conditionsPaiement: facture.conditionsPaiement ?? "",
          tauxPenaliteRetard: facture.tauxPenaliteRetard
            ? facture.tauxPenaliteRetard.toString()
            : "10",
          notes: facture.notes ?? "",
          lignes: facture.lignes.map((l) => ({
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
