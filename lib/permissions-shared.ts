import type { RoleUtilisateur } from "@prisma/client";

export type DomaineAcces =
  | "membres"
  | "cotisations"
  | "reunions"
  | "depenses"
  | "dons"
  | "budget"
  | "rapport"
  | "entreprise"
  | "abonnement"
  | "equipe"
  | "annonces";

// Accès par rôle, pertinent uniquement pour un compte association : un
// compte entreprise n'utilise que owner/membre, qui valent "tout" ici, donc
// leur comportement existant reste inchangé.
const ACCES_PAR_ROLE: Record<RoleUtilisateur, DomaineAcces[] | "tout"> = {
  owner: "tout",
  membre: "tout",
  tresorier: ["cotisations", "dons", "budget", "depenses", "rapport"],
  secretaire: ["membres", "reunions"],
  communication: ["reunions", "annonces"],
};

export function peutAcceder(role: RoleUtilisateur, domaine: DomaineAcces): boolean {
  const acces = ACCES_PAR_ROLE[role];
  return acces === "tout" || acces.includes(domaine);
}

export const MESSAGE_ACCES_REFUSE = "Votre rôle ne permet pas d'accéder à cette fonctionnalité.";
