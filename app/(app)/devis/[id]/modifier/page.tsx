import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateDevis } from "@/lib/actions/documents";
import { listerClientsOptions, listerArticlesOptions } from "@/lib/documents/options";
import { DocumentForm } from "@/components/documents/document-form";

export default async function ModifierDevisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const devis = await prisma.document.findFirst({
    where: { id, tenantId: session.tenantId, type: "devis" },
    include: { lignes: { orderBy: { ordre: "asc" } } },
  });
  if (!devis) notFound();
  if (devis.statut !== "brouillon") {
    redirect(`/devis/${devis.id}`);
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
      <h1 className="font-titre text-2xl text-encre">Modifier le devis {devis.numero}</h1>
      <DocumentForm
        type="devis"
        clients={clients}
        articles={articles}
        regimeTvaNormal={tenant.regimeTva === "normal"}
        action={updateDevis.bind(null, devis.id)}
        initial={{
          clientId: devis.clientId,
          dateEmission: devis.dateEmission.toISOString().slice(0, 10),
          dateEcheance: devis.dateEcheance
            ? devis.dateEcheance.toISOString().slice(0, 10)
            : "",
          conditionsPaiement: devis.conditionsPaiement ?? "",
          tauxPenaliteRetard: devis.tauxPenaliteRetard
            ? devis.tauxPenaliteRetard.toString()
            : "10",
          notes: devis.notes ?? "",
          lignes: devis.lignes.map((l) => ({
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
