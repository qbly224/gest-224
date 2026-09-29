import { z } from "zod";
import { TAUX_TVA_AUTORISES } from "@/lib/validation/article";

export const factureRecurrenteSchema = z.object({
  clientId: z.string().trim().min(1, "Client requis."),
  designation: z.string().trim().min(1, "Désignation requise.").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  quantite: z.coerce
    .number()
    .positive("La quantité doit être positive.")
    .max(1_000_000, "La quantité est trop élevée."),
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
  conditionsPaiement: z.string().trim().max(500).optional().or(z.literal("")),
  frequence: z.enum(["mensuelle", "trimestrielle", "annuelle"]),
  prochaineGenerationDate: z.string().min(1, "Date requise."),
});

export type FactureRecurrenteInput = z.infer<typeof factureRecurrenteSchema>;
