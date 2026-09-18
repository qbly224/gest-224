import { z } from "zod";

export const depenseSchema = z.object({
  date: z.string().trim().min(1, "La date est requise."),
  libelle: z.string().trim().min(1, "Le libellé est requis.").max(200),
  montant: z.coerce.number().positive("Le montant doit être positif.").max(10_000_000),
  categorie: z.string().trim().max(100).optional().or(z.literal("")),
});

export type DepenseInput = z.infer<typeof depenseSchema>;
