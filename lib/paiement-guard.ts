import "server-only";
import type { PlanAbonnement } from "@prisma/client";

/**
 * Vrai quand un tenant est sur un plan payant mais que son paiement n'a
 * pas (ou plus) été validé — Stripe pas encore confirmé, paiement en
 * espèces en attente de validation par un admin, ou suspendu pour défaut
 * de paiement. Les pages en lecture restent accessibles (historique) ;
 * seules les actions de création doivent appeler ce garde.
 */
export function paiementBloque(tenant: {
  plan: PlanAbonnement;
  paiementValide: boolean;
}): boolean {
  return tenant.plan !== "gratuit" && !tenant.paiementValide;
}

export const MESSAGE_PAIEMENT_BLOQUE =
  "Votre paiement est en attente de validation — vous pouvez consulter votre historique, mais pas créer de nouveaux éléments tant qu'il n'est pas validé. Voir la page Abonnement.";
