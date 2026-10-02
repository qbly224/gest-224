import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Journal d'audit (fondation ISCA - art. 88 loi de finances 2016, art.
 * 286-I-3° bis CGI) : trace les actions significatives sur les documents,
 * la comptabilité et l'administration. Volontairement "fire-and-forget" :
 * un échec d'écriture du journal ne doit jamais faire échouer l'action
 * métier qu'il accompagne.
 */
export async function enregistrerAudit(params: {
  tenantId: string;
  userId?: string | null;
  action: string;
  entite?: string;
  entiteId?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId ?? null,
        action: params.action,
        entite: params.entite,
        entiteId: params.entiteId,
        details: params.details as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (erreur) {
    console.error("[audit] échec d'écriture du journal :", erreur);
  }
}
