import type { PlanAbonnement } from "@prisma/client";

// Aucun paiement réel n'est traité en Phase 5 : ces définitions ne pilotent
// que l'affichage (page tarifs, page abonnement) et les limites d'usage
// vérifiées côté serveur. Le passage à un vrai processeur de paiement
// (Stripe ou équivalent) n'a besoin de changer que ce fichier + l'ajout du
// flux de paiement, pas le reste de l'application.
export type DefinitionPlan = {
  id: PlanAbonnement;
  label: string;
  prixMensuel: number;
  limiteDocumentsParMois: number | null; // null = illimité
  limiteClients: number | null;
  fonctionnalites: string[];
};

export const PLANS: Record<PlanAbonnement, DefinitionPlan> = {
  gratuit: {
    id: "gratuit",
    label: "Gratuit",
    prixMensuel: 0,
    limiteDocumentsParMois: 5,
    limiteClients: 10,
    fonctionnalites: [
      "5 documents par mois (devis, factures, etc.)",
      "10 clients",
      "Génération PDF illimitée",
      "Comptabilité simplifiée",
    ],
  },
  starter: {
    id: "starter",
    label: "Starter",
    prixMensuel: 19,
    limiteDocumentsParMois: 50,
    limiteClients: 100,
    fonctionnalites: [
      "50 documents par mois",
      "100 clients",
      "Toute la chaîne documentaire (devis à avoir)",
      "Comptabilité simplifiée",
    ],
  },
  pro: {
    id: "pro",
    label: "Pro",
    prixMensuel: 49,
    limiteDocumentsParMois: null,
    limiteClients: null,
    fonctionnalites: [
      "Documents illimités",
      "Clients illimités",
      "Toute la chaîne documentaire (devis à avoir)",
      "Comptabilité simplifiée",
    ],
  },
};

export const LISTE_PLANS = [PLANS.gratuit, PLANS.starter, PLANS.pro];

export function estPlanValide(value: string): value is PlanAbonnement {
  return value === "gratuit" || value === "starter" || value === "pro";
}
