import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nomAffichageClientSnapshot } from "@/lib/documents/snapshot";
import { TITRES_DOCUMENT, STATUT_LABELS } from "@/lib/documents/statut-labels";
import type { ClientSnapshot } from "@/lib/documents/snapshot";
import type { TypeDocument } from "@prisma/client";

const BASE_PATH: Record<TypeDocument, string> = {
  devis: "/devis",
  bon_commande: "/bons-commande",
  bon_livraison: "/bons-livraison",
  facture: "/factures",
  facture_acompte: "/factures-acompte",
  facture_avoir: "/avoirs",
};

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const session = await requireSession();
  const terme = q?.trim();

  const [clients, documents] = terme
    ? await Promise.all([
        prisma.client.findMany({
          where: {
            tenantId: session.tenantId,
            OR: [
              { raisonSociale: { contains: terme, mode: "insensitive" } },
              { nom: { contains: terme, mode: "insensitive" } },
              { prenom: { contains: terme, mode: "insensitive" } },
              { email: { contains: terme, mode: "insensitive" } },
              { ville: { contains: terme, mode: "insensitive" } },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        prisma.document.findMany({
          where: {
            tenantId: session.tenantId,
            OR: [
              { numero: { contains: terme, mode: "insensitive" } },
              { client: { raisonSociale: { contains: terme, mode: "insensitive" } } },
              { client: { nom: { contains: terme, mode: "insensitive" } } },
              { client: { prenom: { contains: terme, mode: "insensitive" } } },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      ])
    : [[], []];

  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">Recherche</h1>
      <form className="mt-4" method="get">
        <input
          type="search"
          name="q"
          autoFocus
          defaultValue={q ?? ""}
          placeholder="Nom de client, numéro de devis/facture…"
          className="w-full max-w-md rounded-sm border border-encre/30 bg-ivoire px-3 py-2 font-sans text-sm text-encre placeholder:text-encre/40 focus:border-encre focus:outline-none"
        />
      </form>

      {!terme ? (
        <p className="mt-6 font-sans text-sm text-encre/60">
          Tapez un nom de client ou un numéro de document pour lancer la recherche.
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          <div>
            <h2 className="font-titre text-lg text-encre">Clients ({clients.length})</h2>
            {clients.length === 0 ? (
              <p className="mt-2 font-sans text-sm text-encre/60">Aucun client trouvé.</p>
            ) : (
              <ul className="mt-2 space-y-1.5 font-sans text-sm">
                {clients.map((c) => (
                  <li key={c.id}>
                    <Link href={`/clients/${c.id}`} className="text-encre hover:underline">
                      {c.type === "professionnel"
                        ? c.raisonSociale
                        : `${c.prenom ?? ""} ${c.nom ?? ""}`.trim()}
                    </Link>
                    <span className="text-encre/50"> — {c.ville}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="font-titre text-lg text-encre">Documents ({documents.length})</h2>
            {documents.length === 0 ? (
              <p className="mt-2 font-sans text-sm text-encre/60">Aucun document trouvé.</p>
            ) : (
              <ul className="mt-2 space-y-1.5 font-sans text-sm">
                {documents.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`${BASE_PATH[d.type]}/${d.id}`}
                      className="font-mono text-encre hover:underline"
                    >
                      {d.numero}
                    </Link>
                    <span className="text-encre/50">
                      {" "}
                      — {TITRES_DOCUMENT[d.type]} —{" "}
                      {nomAffichageClientSnapshot(d.clientSnapshot as unknown as ClientSnapshot)} —{" "}
                      {STATUT_LABELS[d.statut]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
