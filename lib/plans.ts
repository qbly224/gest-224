import type { PlanAbonnement } from "@prisma/client";

export type DefinitionPlan = {
  id: PlanAbonnement;
  label: string;
  prixMensuel: number;
  limiteDocumentsParMois: number | null; // null = illimité
  limiteClients: number | null;
  limiteDepensesParMois: number | null;
  rapportComplet: boolean;
  fonctionnalites: string[];
};

export const PLANS: Record<PlanAbonnement, DefinitionPlan> = {
  gratuit: {
    id: "gratuit",
    label: "Gratuit",
    prixMensuel: 0,
    limiteDocumentsParMois: 5,
    limiteClients: 5,
    limiteDepensesParMois: 5,
    rapportComplet: false,
    fonctionnalites: [
      "5 documents par mois (devis, factures, etc.)",
      "5 clients",
      "Génération PDF illimitée",
      "Comptabilité simplifiée (5 dépenses/mois)",
    ],
  },
  starter: {
    id: "starter",
    label: "Starter",
    prixMensuel: 19,
    limiteDocumentsParMois: 50,
    limiteClients: 100,
    limiteDepensesParMois: null,
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
 * Identifiant du Price Stripe associé à un plan payant — configuré via
 * variables d'environnement (créées dans le dashboard Stripe ou par le
 * script de provisionnement, cf. scripts/stripe-setup.ts). `null` pour
 * gratuit (rien à facturer) ou tant que la variable n'est pas encore posée.
 */
export function stripePriceId(plan: PlanAbonnement): string | null {
  if (plan === "starter") return process.env.STRIPE_PRICE_STARTER || null;
  if (plan === "pro") return process.env.STRIPE_PRICE_PRO || null;
  return null;
}
