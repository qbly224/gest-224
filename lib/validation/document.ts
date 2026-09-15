import { z } from "zod";
import { TAUX_TVA_AUTORISES } from "@/lib/validation/article";

export const ligneSchema = z.object({
  articleId: z.string().trim().nullable().optional(),
  designation: z.string().trim().min(1, "Désignation requise."),
  description: z.string().trim().optional().or(z.literal("")),
  uniteMesure: z.string().trim().optional().or(z.literal("")),
  quantite: z.coerce.number().positive("La quantité doit être positive."),
  prixUnitaireHt: z.coerce.number().nonnegative("Le prix doit être positif ou nul."),
  tauxTva: z
    .union([z.coerce.number(), z.null()])
    .refine(
      (v) => v === null || (TAUX_TVA_AUTORISES as readonly number[]).includes(v),
      "Taux de TVA invalide."
    ),
  remisePourcentage: z.coerce.number().min(0).max(100).default(0),
});

export type LigneInput = z.infer<typeof ligneSchema>;

export const documentBaseSchema = z.object({
  clientId: z.string().trim().min(1, "Le client est requis."),
  dateEmission: z.string().trim().min(1, "La date d'émission est requise."),
  dateEcheance: z.string().trim().optional().or(z.literal("")),
  conditionsPaiement: z.string().trim().optional().or(z.literal("")),
  tauxPenaliteRetard: z.coerce.number().nonnegative().optional().nullable(),
  notes: z.string().trim().optional().or(z.literal("")),
  lignes: z.array(ligneSchema).min(1, "Ajoutez au moins une ligne."),
});

export type DocumentInput = z.infer<typeof documentBaseSchema>;
