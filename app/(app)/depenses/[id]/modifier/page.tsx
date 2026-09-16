import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateDepense } from "@/lib/actions/comptabilite";
import { DepenseForm } from "@/components/comptabilite/depense-form";

export default async function ModifierDepensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const depense = await prisma.depense.findFirst({
    where: { id, tenantId: session.tenantId },
  });
  if (!depense) notFound();

  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">Modifier la dépense</h1>
      <DepenseForm
        depense={{ ...depense, montant: depense.montant.toString() }}
        action={updateDepense.bind(null, depense.id)}
      />
    </div>
  );
}
