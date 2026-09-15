import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateClient } from "@/lib/actions/clients";
import { ClientForm } from "@/components/clients/client-form";

export default async function ModifierClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const client = await prisma.client.findFirst({
    where: { id, tenantId: session.tenantId },
  });

  if (!client) {
    notFound();
  }

  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">
        Modifier le client
      </h1>
      <ClientForm client={client} action={updateClient.bind(null, client.id)} />
    </div>
  );
}
