import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createFactureAcompte } from "@/lib/actions/documents";
import { listerClientsOptions, listerArticlesOptions } from "@/lib/documents/options";
import { DocumentForm } from "@/components/documents/document-form";

export default async function NouvelleFactureAcomptePage() {
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
      <h1 className="font-titre text-2xl text-encre">Nouvelle facture d&apos;acompte</h1>
      {clients.length === 0 ? (
        <p className="mt-4 font-sans text-sm text-encre/70">
          Créez d&apos;abord un client avant d&apos;émettre une facture d&apos;acompte.
        </p>
      ) : (
        <DocumentForm
          type="facture_acompte"
          clients={clients}
          articles={articles}
          regimeTvaNormal={tenant.regimeTva === "normal"}
          action={createFactureAcompte}
        />
      )}
    </div>
  );
}
