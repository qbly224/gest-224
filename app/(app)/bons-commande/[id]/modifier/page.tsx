import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateBonCommande } from "@/lib/actions/documents";
import { listerClientsOptions, listerArticlesOptions } from "@/lib/documents/options";
import { DocumentForm } from "@/components/documents/document-form";

export default async function ModifierBonCommandePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const t = await getTranslations("app.bonsCommande");

  const bonCommande = await prisma.document.findFirst({
    where: { id, tenantId: session.tenantId, type: "bon_commande" },
    include: { lignes: { orderBy: { ordre: "asc" } } },
  });
  if (!bonCommande) notFound();
  if (bonCommande.statut !== "brouillon") {
    redirect(`/bons-commande/${bonCommande.id}`);
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
        {t("titreModifier", { numero: bonCommande.numero })}
      </h1>
      <DocumentForm
        type="bon_commande"
        clients={clients}
        articles={articles}
        regimeTvaNormal={tenant.regimeTva === "normal"}
        action={updateBonCommande.bind(null, bonCommande.id)}
        initial={{
          clientId: bonCommande.clientId,
          dateEmission: bonCommande.dateEmission.toISOString().slice(0, 10),
          dateEcheance: "",
          conditionsPaiement: bonCommande.conditionsPaiement ?? "",
          tauxPenaliteRetard: "10",
          notes: bonCommande.notes ?? "",
          lignes: bonCommande.lignes.map((l) => ({
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
