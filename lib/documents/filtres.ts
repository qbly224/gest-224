import type { Prisma, StatutDocument, TypeDocument } from "@prisma/client";

/**
 * Construit le where Prisma commun aux 6 listes de documents : recherche
 * texte sur le numéro et le nom du client (donnée vivante, pas le snapshot
 * figé), plus filtre optionnel par statut.
 */
export function construireWhereDocuments(
  tenantId: string,
  type: TypeDocument,
  { q, statut }: { q?: string; statut?: string }
): Prisma.DocumentWhereInput {
  const terme = q?.trim();

  return {
    tenantId,
    type,
    ...(statut ? { statut: statut as StatutDocument } : {}),
    ...(terme
      ? {
          OR: [
            { numero: { contains: terme, mode: "insensitive" } },
            { client: { raisonSociale: { contains: terme, mode: "insensitive" } } },
            { client: { nom: { contains: terme, mode: "insensitive" } } },
            { client: { prenom: { contains: terme, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
}
