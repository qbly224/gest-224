import "server-only";
import { randomUUID } from "crypto";
import type { Prisma, TypeDocument } from "@prisma/client";

const PREFIXES: Record<TypeDocument, string> = {
  devis: "DEV",
  bon_commande: "BC",
  bon_livraison: "BL",
  facture: "FA",
  facture_acompte: "AC",
  facture_avoir: "AV",
};

/**
 * Numéro suivant pour une entreprise/type/année, sans trou ni doublon même
 * en cas d'accès concurrent : verrouille la ligne du compteur (SELECT ...
 * FOR UPDATE) dans la transaction appelante, l'incrémente, puis la relâche
 * au commit. Doit impérativement être appelé à l'intérieur d'un
 * prisma.$transaction(...).
 */
export async function getNextNumero(
  tx: Prisma.TransactionClient,
  tenantId: string,
  type: TypeDocument
): Promise<string> {
  const annee = new Date().getFullYear();
  const prefixe = PREFIXES[type];

  await tx.$executeRaw`
    INSERT INTO numbering_sequences (id, tenant_id, type_document, annee, prefixe, dernier_numero, updated_at)
    VALUES (${randomUUID()}, ${tenantId}, ${type}::"TypeDocument", ${annee}, ${prefixe}, 0, now())
    ON CONFLICT (tenant_id, type_document, annee) DO NOTHING
  `;

  const rows = await tx.$queryRaw<{ id: string; dernierNumero: number }[]>`
    SELECT id, dernier_numero AS "dernierNumero"
    FROM numbering_sequences
    WHERE tenant_id = ${tenantId} AND type_document = ${type}::"TypeDocument" AND annee = ${annee}
    FOR UPDATE
  `;

  const current = rows[0];
  const suivant = current.dernierNumero + 1;

  await tx.numberingSequence.update({
    where: { id: current.id },
    data: { dernierNumero: suivant },
  });

  return `${prefixe}-${annee}-${String(suivant).padStart(4, "0")}`;
}
