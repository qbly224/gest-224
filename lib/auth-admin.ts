import "server-only";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/session";

/**
 * Garde d'accès aux pages/actions de gestion de la plateforme (tous tenants
 * confondus). Le drapeau `estAdminPlateforme` n'est volontairement pas
 * porté par le jeton JWT — il est relu en base à chaque appel, comme
 * `actif`/`passwordChangedAt` dans requireSession(), pour qu'une révocation
 * prenne effet immédiatement sans attendre l'expiration de la session.
 */
export async function requirePlatformAdmin(): Promise<SessionPayload> {
  const session = await requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { estAdminPlateforme: true },
  });
  if (!user?.estAdminPlateforme) {
    redirect("/tableau-de-bord");
  }
  return session;
}
