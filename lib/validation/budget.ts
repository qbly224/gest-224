import { z } from "zod";

export const typeLigneBudgetSchema = z.enum(["recette", "depense"]);

const anneeCourante = new Date().getFullYear();

export const ligneBudgetSchema = z.object({
  annee: z.coerce.number().int().min(2000).max(anneeCourante + 10),
  categorie: z.string().trim().min(1, "La catégorie est requise.").max(100),
  type: typeLigneBudgetSchema,
  montantPrevu: z.coerce.number().positive("Le montant doit être positif.").max(9_999_999),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type LigneBudgetInput = z.infer<typeof ligneBudgetSchema>;
