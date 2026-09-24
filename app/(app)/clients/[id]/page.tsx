import { notFound } from "next/navigation";
import { Phone } from "lucide-react";
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">
          Modifier le client
        </h1>
        {client.telephone && (
          <a
            href={`tel:${client.telephone}`}
            className="inline-flex items-center gap-2 rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
          >
            <Phone size={16} strokeWidth={1.75} />
            Appeler {client.telephone}
          </a>
        )}
      </div>
      <ClientForm client={client} action={updateClient.bind(null, client.id)} />
    </div>
  );
}
