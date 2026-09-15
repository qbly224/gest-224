import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateAvoir } from "@/lib/actions/documents";
import { listerClientsOptions, listerArticlesOptions } from "@/lib/documents/options";
import { DocumentForm } from "@/components/documents/document-form";

export default async function ModifierAvoirPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const avoir = await prisma.document.findFirst({
    where: { id, tenantId: session.tenantId, type: "facture_avoir" },
    include: { lignes: { orderBy: { ordre: "asc" } } },
  });
  if (!avoir) notFound();
  if (avoir.statut !== "brouillon") {
    redirect(`/avoirs/${avoir.id}`);
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
      <h1 className="font-titre text-2xl text-encre">Modifier l&apos;avoir {avoir.numero}</h1>
      <p className="mt-1 font-sans text-sm text-encre/70">
        Une quantité négative représente le montant à déduire. Supprimez ou
        ajustez les lignes pour un avoir partiel.
      </p>
      <DocumentForm
        type="facture_avoir"
        clients={clients}
        articles={articles}
        regimeTvaNormal={tenant.regimeTva === "normal"}
        action={updateAvoir.bind(null, avoir.id)}
        initial={{
          clientId: avoir.clientId,
          dateEmission: avoir.dateEmission.toISOString().slice(0, 10),
          dateEcheance: "",
          conditionsPaiement: avoir.conditionsPaiement ?? "",
          tauxPenaliteRetard: "10",
          notes: avoir.notes ?? "",
          lignes: avoir.lignes.map((l) => ({
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
