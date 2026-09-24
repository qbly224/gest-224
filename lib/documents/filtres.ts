import type { Prisma, StatutDocument, TypeDocument } from "@prisma/client";

export type ChampTriDocument = "numero" | "date" | "montant" | "client";

/**
 * Construit le where Prisma commun aux 6 listes de documents : recherche
 * texte sur le numéro et le nom du client (donnée vivante, pas le snapshot
 * figé), filtre optionnel par statut et par plage de dates d'émission.
 */
export function construireWhereDocuments(
  tenantId: string,
  type: TypeDocument,
  { q, statut, depuis, jusqua }: { q?: string; statut?: string; depuis?: string; jusqua?: string }
): Prisma.DocumentWhereInput {
  const terme = q?.trim();

  return {
    tenantId,
    type,
    ...(statut ? { statut: statut as StatutDocument } : {}),
    ...(depuis || jusqua
      ? {
          dateEmission: {
            ...(depuis ? { gte: new Date(depuis) } : {}),
            // +1 jour pour inclure toute la journée de fin sélectionnée.
            ...(jusqua ? { lt: new Date(new Date(jusqua).getTime() + 86_400_000) } : {}),
          },
        }
      : {}),
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

/**
 * Le tri par "client" approxime l'ordre alphabétique en triant sur
 * raisonSociale puis nom : exact pour les clients professionnels, une
 * approximation raisonnable pour les particuliers (pas de colonne calculée
 * unique en base pour le nom affiché).
 */
export function construireOrderByDocuments(
  tri: string | undefined,
  ordre: string | undefined
): Prisma.DocumentOrderByWithRelationInput | Prisma.DocumentOrderByWithRelationInput[] {
  const direction = ordre === "asc" ? "asc" : "desc";

  switch (tri as ChampTriDocument | undefined) {
    case "numero":
      return { numero: direction };
    case "date":
      return { dateEmission: direction };
    case "montant":
      return { montantTtc: direction };
    case "client":
      return [{ client: { raisonSociale: direction } }, { client: { nom: direction } }];
    default:
      return { createdAt: "desc" };
  }
}
