import { z } from "zod";

export const depenseSchema = z.object({
  date: z.string().trim().min(1, "La date est requise."),
  libelle: z.string().trim().min(1, "Le libellé est requis."),
  montant: z.coerce.number().positive("Le montant doit être positif."),
  categorie: z.string().trim().optional().or(z.literal("")),
});

export type DepenseInput = z.infer<typeof depenseSchema>;
