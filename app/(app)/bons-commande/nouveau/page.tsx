import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBonCommande } from "@/lib/actions/documents";
import { listerClientsOptions, listerArticlesOptions } from "@/lib/documents/options";
import { DocumentForm } from "@/components/documents/document-form";

export default async function NouveauBonCommandePage() {
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
      <h1 className="font-titre text-2xl text-encre">Nouveau bon de commande</h1>
      <p className="mt-1 font-sans text-sm text-encre/70">
        Pour confirmer un devis accepté, utilisez plutôt le bouton
        « Convertir en bon de commande » depuis la fiche du devis.
      </p>
      {clients.length === 0 ? (
        <p className="mt-4 font-sans text-sm text-encre/70">
          Créez d&apos;abord un client avant d&apos;émettre un bon de commande.
        </p>
      ) : (
        <DocumentForm
          type="bon_commande"
          clients={clients}
          articles={articles}
          regimeTvaNormal={tenant.regimeTva === "normal"}
          action={createBonCommande}
        />
      )}
    </div>
  );
}
