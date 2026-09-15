import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBonLivraison } from "@/lib/actions/documents";
import { listerClientsOptions, listerArticlesOptions } from "@/lib/documents/options";
import { DocumentForm } from "@/components/documents/document-form";

export default async function NouveauBonLivraisonPage() {
  const session = await requireSession();
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
      <h1 className="font-titre text-2xl text-encre">Nouveau bon de livraison</h1>
      <p className="mt-1 font-sans text-sm text-encre/70">
        Pour livrer un bon de commande envoyé, utilisez plutôt le bouton
        « Convertir en bon de livraison » depuis sa fiche. Les prix ne sont
        pas imprimés sur ce document.
      </p>
      {clients.length === 0 ? (
        <p className="mt-4 font-sans text-sm text-encre/70">
          Créez d&apos;abord un client avant d&apos;émettre un bon de livraison.
        </p>
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
