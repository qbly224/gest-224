import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EntrepriseForm } from "@/components/entreprise/entreprise-form";
import { SupprimerCompteForm } from "@/components/entreprise/supprimer-compte-form";

export default async function EntreprisePage() {
  const session = await requireSession();
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: session.tenantId },
  });

  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">Fiche entreprise</h1>
      <p className="mt-1 font-sans text-sm text-encre/70">
        Ces informations apparaissent sur tous vos documents commerciaux.
      </p>
      <EntrepriseForm
        tenant={{
          ...tenant,
          capitalSocial: tenant.capitalSocial ? tenant.capitalSocial.toString() : null,
        }}
      />

      <div className="mt-12 rounded-sm border border-red-200 bg-red-50/40 p-6">
        <h2 className="font-titre text-lg text-red-800">Zone dangereuse</h2>
        <p className="mt-1 font-sans text-sm text-red-700/80">
          Supprime définitivement votre entreprise et toutes ses données
          (clients, catalogue, documents, comptabilité). Cette action est
          irréversible.
        </p>
        <SupprimerCompteForm />
      </div>
    </div>
  );
}
