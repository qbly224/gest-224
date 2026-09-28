import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBonLivraison } from "@/lib/actions/documents";
import { listerClientsOptions, listerArticlesOptions } from "@/lib/documents/options";
import { DocumentForm } from "@/components/documents/document-form";

export default async function NouveauBonLivraisonPage() {
  const session = await requireSession();
  const t = await getTranslations("app.bonsLivraison");
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
      <h1 className="font-titre text-2xl text-encre">{t("titreNouveau")}</h1>
      <p className="mt-1 font-sans text-sm text-encre/70">{t("avertissementNouveau")}</p>
      {clients.length === 0 ? (
        <p className="mt-4 font-sans text-sm text-encre/70">{t("pasDeClient")}</p>
      ) : (
        <DocumentForm
          type="bon_livraison"
          clients={clients}
          articles={articles}
          regimeTvaNormal={tenant.regimeTva === "normal"}
          action={createBonLivraison}
        />
      )}
    </div>
  );
}
