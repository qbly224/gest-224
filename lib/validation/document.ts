import { z } from "zod";
import { TAUX_TVA_AUTORISES } from "@/lib/validation/article";

const MAX_LIGNES_PAR_DOCUMENT = 200;

const champsLigneCommuns = {
  articleId: z.string().trim().nullable().optional(),
  designation: z.string().trim().min(1, "Désignation requise.").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  uniteMesure: z.string().trim().max(30).optional().or(z.literal("")),
  prixUnitaireHt: z.coerce
    .number()
    .nonnegative("Le prix doit être positif ou nul.")
    .max(10_000_000, "Le prix unitaire est trop élevé."),
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
  quantite: z.coerce
    .number()
    .positive("La quantité doit être positive.")
    .max(1_000_000, "La quantité est trop élevée."),
});

export type LigneInput = z.infer<typeof ligneSchema>;

// Sur un avoir, une quantité négative représente le montant à déduire (la
// désignation reste positive en prix unitaire, comme au catalogue).
export const ligneAvoirSchema = z.object({
  ...champsLigneCommuns,
  quantite: z.coerce
    .number()
    .refine((v) => v !== 0, "La quantité ne peut pas être nulle.")
    .refine((v) => Math.abs(v) <= 1_000_000, "La quantité est trop élevée."),
});

const champsDocumentCommuns = {
  clientId: z.string().trim().min(1, "Le client est requis."),
  dateEmission: z.string().trim().min(1, "La date d'émission est requise."),
  dateEcheance: z.string().trim().optional().or(z.literal("")),
  conditionsPaiement: z.string().trim().max(500).optional().or(z.literal("")),
  tauxPenaliteRetard: z.coerce.number().nonnegative().max(100).optional().nullable(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
};

export const documentBaseSchema = z.object({
  ...champsDocumentCommuns,
  lignes: z
    .array(ligneSchema)
    .min(1, "Ajoutez au moins une ligne.")
    .max(MAX_LIGNES_PAR_DOCUMENT, `Un document ne peut pas dépasser ${MAX_LIGNES_PAR_DOCUMENT} lignes.`),
});

export type DocumentInput = z.infer<typeof documentBaseSchema>;

export const documentAvoirSchema = z.object({
  ...champsDocumentCommuns,
  lignes: z
    .array(ligneAvoirSchema)
    .min(1, "Ajoutez au moins une ligne.")
    .max(MAX_LIGNES_PAR_DOCUMENT, `Un document ne peut pas dépasser ${MAX_LIGNES_PAR_DOCUMENT} lignes.`),
});
