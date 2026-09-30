import { z } from "zod";

export const chantierSchema = z.object({
  titre: z.string().trim().min(1, "Titre requis.").max(200),
  clientId: z.string().trim().optional().or(z.literal("")),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  adresse: z.string().trim().max(300).optional().or(z.literal("")),
  montant: z
    .union([z.coerce.number().nonnegative("Le montant doit être positif ou nul.").max(10_000_000), z.literal("")])
    .optional(),
  statut: z.enum(["a_faire", "en_cours", "fait", "annule"]),
  dateDebut: z.string().trim().optional().or(z.literal("")),
  dateEcheance: z.string().trim().optional().or(z.literal("")),
});

export type ChantierInput = z.infer<typeof chantierSchema>;
