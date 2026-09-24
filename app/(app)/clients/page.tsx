import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toggleClientActif } from "@/lib/actions/clients";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; statut?: string }>;
}) {
  const { q, statut } = await searchParams;
  const session = await requireSession();
  const terme = q?.trim();

  const clients = await prisma.client.findMany({
    where: {
      tenantId: session.tenantId,
      ...(statut === "actifs" ? { actif: true } : statut === "desactives" ? { actif: false } : {}),
      ...(terme
        ? {
            OR: [
              { raisonSociale: { contains: terme, mode: "insensitive" } },
              { nom: { contains: terme, mode: "insensitive" } },
              { prenom: { contains: terme, mode: "insensitive" } },
              { email: { contains: terme, mode: "insensitive" } },
              { ville: { contains: terme, mode: "insensitive" } },
            ],
          }
        : {}),
    },
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

      <form className="mt-4 flex flex-wrap items-center gap-2" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Rechercher un nom, une ville, un email…"
          className="w-full max-w-xs rounded-sm border border-encre/30 bg-ivoire px-3 py-2 font-sans text-sm text-encre placeholder:text-encre/40 focus:border-encre focus:outline-none"
        />
        <select
          name="statut"
          defaultValue={statut ?? ""}
          className="rounded-sm border border-encre/30 bg-ivoire px-3 py-2 font-sans text-sm text-encre focus:border-encre focus:outline-none"
        >
          <option value="">Tous</option>
          <option value="actifs">Actifs</option>
          <option value="desactives">Désactivés</option>
        </select>
        <button
          type="submit"
          className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
        >
          Filtrer
        </button>
        {(q || statut) && (
          <a href="?" className="font-sans text-xs text-encre/60 underline">
            Réinitialiser
          </a>
        )}
      </form>

      {clients.length === 0 ? (
        <p className="mt-8 font-sans text-sm text-encre/60">
          {q || statut ? "Aucun client ne correspond à ces critères." : "Aucun client pour l'instant."}
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
