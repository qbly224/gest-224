import { z } from "zod";
import { TAUX_TVA_AUTORISES } from "@/lib/validation/article";

const champsLigneCommuns = {
  articleId: z.string().trim().nullable().optional(),
  designation: z.string().trim().min(1, "Désignation requise."),
  description: z.string().trim().optional().or(z.literal("")),
  uniteMesure: z.string().trim().optional().or(z.literal("")),
  prixUnitaireHt: z.coerce.number().nonnegative("Le prix doit être positif ou nul."),
  tauxTva: z
    .union([z.coerce.number(), z.null()])
    .refine(
      (v) => v === null || (TAUX_TVA_AUTORISES as readonly number[]).includes(v),
      "Taux de TVA invalide."
    ),
  remisePourcentage: z.coerce.number().min(0).max(100).default(0),
};

export const ligneSchema = z.object({
  ...champsLigneCommuns,
  quantite: z.coerce.number().positive("La quantité doit être positive."),
});

export type LigneInput = z.infer<typeof ligneSchema>;

// Sur un avoir, une quantité négative représente le montant à déduire (la
// désignation reste positive en prix unitaire, comme au catalogue).
export const ligneAvoirSchema = z.object({
  ...champsLigneCommuns,
  quantite: z.coerce.number().refine((v) => v !== 0, "La quantité ne peut pas être nulle."),
});

const champsDocumentCommuns = {
  clientId: z.string().trim().min(1, "Le client est requis."),
  dateEmission: z.string().trim().min(1, "La date d'émission est requise."),
  dateEcheance: z.string().trim().optional().or(z.literal("")),
  conditionsPaiement: z.string().trim().optional().or(z.literal("")),
  tauxPenaliteRetard: z.coerce.number().nonnegative().optional().nullable(),
  notes: z.string().trim().optional().or(z.literal("")),
};

export const documentBaseSchema = z.object({
  ...champsDocumentCommuns,
  lignes: z.array(ligneSchema).min(1, "Ajoutez au moins une ligne."),
});

export type DocumentInput = z.infer<typeof documentBaseSchema>;

export const documentAvoirSchema = z.object({
  ...champsDocumentCommuns,
  lignes: z.array(ligneAvoirSchema).min(1, "Ajoutez au moins une ligne."),
});
