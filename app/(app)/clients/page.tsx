import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toggleClientActif } from "@/lib/actions/clients";

export default async function ClientsPage() {
  const session = await requireSession();
  const clients = await prisma.client.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">Clients</h1>
        <Link
          href="/clients/nouveau"
          className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
        >
          Nouveau client
        </Link>
      </div>

      {clients.length === 0 ? (
        <p className="mt-8 font-sans text-sm text-encre/60">
          Aucun client pour l&apos;instant.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse font-sans text-sm">
          <thead>
            <tr className="border-b border-encre/20 text-left text-encre/60">
              <th className="py-2 font-medium">Nom / Raison sociale</th>
              <th className="py-2 font-medium">Ville</th>
              <th className="py-2 font-medium">Email</th>
              <th className="py-2 font-medium">Statut</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => {
              const label =
                client.type === "professionnel"
                  ? client.raisonSociale
                  : `${client.civilite ?? ""} ${client.prenom ?? ""} ${
                      client.nom ?? ""
                    }`.trim();
              return (
                <tr key={client.id} className="border-b border-encre/10">
                  <td className="py-3">
                    <Link
                      href={`/clients/${client.id}`}
                      className="text-encre hover:underline"
                    >
                      {label || "—"}
                    </Link>
                  </td>
                  <td className="py-3 text-encre/70">{client.ville}</td>
                  <td className="py-3 text-encre/70">
                    {client.email ?? "—"}
                  </td>
                  <td className="py-3">
                    <span
                      className={
                        client.actif
                          ? "font-mono text-xs text-encre"
                          : "font-mono text-xs text-encre/40"
                      }
                    >
                      {client.actif ? "actif" : "désactivé"}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <form action={toggleClientActif.bind(null, client.id)}>
                      <button
                        type="submit"
                        className="font-sans text-xs text-encre/60 hover:text-encre hover:underline"
                      >
                        {client.actif ? "Désactiver" : "Réactiver"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
