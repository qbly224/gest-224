import { z } from "zod";

export const reunionSchema = z.object({
  titre: z.string().trim().min(1, "Le titre est requis.").max(200),
  date: z.string().trim().min(1, "La date est requise."),
  lieu: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  compteRendu: z.string().trim().max(5000).optional().or(z.literal("")),
});

export type ReunionInput = z.infer<typeof reunionSchema>;
