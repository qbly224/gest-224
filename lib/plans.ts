import type { PlanAbonnement, TypeCompte } from "@prisma/client";

export type DefinitionPlan = {
  id: PlanAbonnement;
  label: string;
  prixMensuel: number;
  limiteDocumentsParMois: number | null; // null = illimité
  limiteClients: number | null;
  limiteDepensesParMois: number | null;
  limitePdfParMois: number | null;
  // Plafond de membres pour un compte "association" - indépendant de
  // limiteClients (un compte association ne crée jamais de Client).
  limiteMembres: number | null;
  rapportComplet: boolean;
  fonctionnalites: string[];
};

export const PLANS: Record<PlanAbonnement, DefinitionPlan> = {
  gratuit: {
    id: "gratuit",
    label: "Gratuit",
    prixMensuel: 0,
    limiteDocumentsParMois: 4,
    limiteClients: 4,
    limiteDepensesParMois: 0,
    limitePdfParMois: 4,
    limiteMembres: 10,
    rapportComplet: false,
    fonctionnalites: [
      "4 documents par mois (devis, factures, etc.)",
      "4 clients",
      "4 générations de PDF par mois",
    ],
  },
  starter: {
    id: "starter",
    label: "Starter",
    prixMensuel: 19,
    limiteDocumentsParMois: 50,
    limiteClients: 100,
    limiteDepensesParMois: null,
    limitePdfParMois: null,
    limiteMembres: 150,
    rapportComplet: true,
    fonctionnalites: [
      "50 documents par mois",
      "100 clients",
      "Toute la chaîne documentaire (devis à avoir)",
      "Comptabilité simplifiée illimitée",
      "Rapport complet (comptabilité + activité)",
    ],
  },
  pro: {
    id: "pro",
    label: "Pro",
    prixMensuel: 49,
    limiteDocumentsParMois: null,
    limiteClients: null,
    limiteDepensesParMois: null,
    limitePdfParMois: null,
    limiteMembres: null,
    rapportComplet: true,
    fonctionnalites: [
      "Documents illimités",
      "Clients illimités",
      "Toute la chaîne documentaire (devis à avoir)",
      "Comptabilité simplifiée illimitée",
      "Rapport complet (comptabilité + activité)",
    ],
  },
};

export const LISTE_PLANS = [PLANS.gratuit, PLANS.starter, PLANS.pro];

export function estPlanValide(value: string): value is PlanAbonnement {
  return value === "gratuit" || value === "starter" || value === "pro";
}

/**
 * Limites réellement applicables à un tenant : pour un compte association
 * ayant payé (ou en cours d'essai gratuit - les deux mettent
 * paiementValide=true et plan="starter" dès le webhook
 * checkout.session.completed, cf. app/api/stripe/webhook/route.ts),
 * l'accès est illimité quel que soit le plan Starter facturé en arrière-
 * plan - une association ne choisit pas de palier, seulement si elle
 * paie ou non. Tant que le paiement n'a pas été initié (plan encore
 * "gratuit"), les limites du plan gratuit s'appliquent normalement.
 */
export function limitesEffectives(tenant: {
  plan: PlanAbonnement;
  typeCompte: TypeCompte;
}): DefinitionPlan {
  if (tenant.typeCompte === "association" && tenant.plan !== "gratuit") {
    return {
      ...PLANS[tenant.plan],
      limiteDocumentsParMois: null,
      limiteClients: null,
      limiteDepensesParMois: null,
      limitePdfParMois: null,
      limiteMembres: null,
    };
  }
  return PLANS[tenant.plan];
}

/**
 * Identifiant du Price Stripe associé à un plan payant - configuré via
 * variables d'environnement (créées dans le dashboard Stripe ou par le
 * script de provisionnement, cf. scripts/stripe-setup.ts). `null` pour
 * gratuit (rien à facturer) ou tant que la variable n'est pas encore posée.
 */
export function stripePriceId(plan: PlanAbonnement): string | null {
  if (plan === "starter") return process.env.STRIPE_PRICE_STARTER || null;
  if (plan === "pro") return process.env.STRIPE_PRICE_PRO || null;
  return null;
}
