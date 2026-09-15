import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EntrepriseForm } from "@/components/entreprise/entreprise-form";

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
    </div>
  );
}
