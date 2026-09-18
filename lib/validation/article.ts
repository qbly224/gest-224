import { z } from "zod";

export const typeArticleSchema = z.enum(["produit", "service"]);

// Taux de TVA autorisés en régime normal (France).
export const TAUX_TVA_AUTORISES = [0, 5.5, 10, 20] as const;

export const articleSchema = z.object({
  type: typeArticleSchema,
  reference: z.string().trim().max(50).optional().or(z.literal("")),
  designation: z.string().trim().min(1, "La désignation est requise.").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  uniteMesure: z.string().trim().max(30).optional().or(z.literal("")),
  prixUnitaireHt: z.coerce
    .number()
    .nonnegative("Le prix unitaire doit être positif ou nul.")
    .max(10_000_000, "Le prix unitaire est trop élevé."),
  // null si l'entreprise est en franchise en base.
  tauxTva: z.coerce
    .number()
    .refine(
      (v) => (TAUX_TVA_AUTORISES as readonly number[]).includes(v),
      "Taux de TVA invalide (valeurs autorisées : 0, 5.5, 10, 20)."
    )
    .nullable(),
});

export type ArticleInput = z.infer<typeof articleSchema>;
