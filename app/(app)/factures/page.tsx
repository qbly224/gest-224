import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentFiltres } from "@/components/documents/document-filtres";
import { construireWhereDocuments, construireOrderByDocuments } from "@/lib/documents/filtres";
import { nomAffichageClientSnapshot } from "@/lib/documents/snapshot";
import type { ClientSnapshot } from "@/lib/documents/snapshot";

const STATUTS_DISPONIBLES = ["brouillon", "envoye", "payee"] as const;

export default async function FacturesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    statut?: string;
    depuis?: string;
    jusqua?: string;
    tri?: string;
    ordre?: string;
    enRetard?: string;
  }>;
}) {
  const { q, statut, depuis, jusqua, tri, ordre, enRetard } = await searchParams;
  const session = await requireSession();
  const where = construireWhereDocuments(session.tenantId, "facture", { q, statut, depuis, jusqua });
  if (enRetard === "1") {
    where.statut = "envoye";
    where.dateEcheance = { lt: new Date() };
  }
  const factures = await prisma.document.findMany({
    where,
    orderBy: construireOrderByDocuments(tri, ordre),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">Factures</h1>
        <Link
          href="/factures/nouveau"
          className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
        >
          Nouvelle facture
        </Link>
      </div>

      {enRetard === "1" && (
        <p className="mt-4 rounded-sm bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
          Factures envoyées dont la date d&apos;échéance est dépassée.{" "}
          <a href="/factures" className="underline">
            Voir toutes les factures
          </a>
        </p>
      )}

      <DocumentFiltres
        q={q}
        statut={statut}
        depuis={depuis}
        jusqua={jusqua}
        statutsDisponibles={[...STATUTS_DISPONIBLES]}
      />

      <DocumentList
        basePath="/factures"
        emptyLabel={
          q || statut || depuis || jusqua
            ? "Aucune facture ne correspond à ces critères."
            : "Aucune facture pour l'instant."
        }
        q={q}
        statut={statut}
        depuis={depuis}
        jusqua={jusqua}
        tri={tri}
        ordre={ordre}
        rows={factures.map((d) => ({
          id: d.id,
          numero: d.numero,
          statut: d.statut,
          dateEmission: d.dateEmission,
          clientLabel: nomAffichageClientSnapshot(d.clientSnapshot as unknown as ClientSnapshot),
          montantTtc: d.montantTtc.toString(),
        }))}
      />
    </div>
  );
}
