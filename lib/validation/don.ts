import { z } from "zod";

export const typeDonSchema = z.enum(["don", "subvention"]);

export const donSchema = z.object({
  type: typeDonSchema,
  donateur: z.string().trim().min(1, "Le donateur est requis.").max(200),
  montant: z.coerce.number().positive("Le montant doit être positif.").max(9_999_999),
  date: z.string().trim().min(1, "La date est requise."),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type DonInput = z.infer<typeof donSchema>;
