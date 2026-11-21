import "server-only";
import { redirect } from "next/navigation";
import type { RoleUtilisateur } from "@prisma/client";
import { withToast } from "@/lib/toast";
import { peutAcceder, MESSAGE_ACCES_REFUSE, type DomaineAcces } from "@/lib/permissions-shared";

export { peutAcceder, MESSAGE_ACCES_REFUSE, type DomaineAcces };

/** À utiliser dans une Server Component (page) protégée : redirige si le rôle de la session n'a pas accès au domaine. */
export function exigerAcces(role: RoleUtilisateur, domaine: DomaineAcces): void {
  if (!peutAcceder(role, domaine)) {
    redirect(withToast("/tableau-de-bord", MESSAGE_ACCES_REFUSE));
  }
}
