import { z } from "zod";

export const cotisationSchema = z.object({
  membreId: z.string().trim().min(1, "Le membre est requis."),
  periode: z.string().trim().min(1, "La période est requise.").max(20),
  montant: z.coerce.number().positive("Le montant doit être positif.").max(999_999),
  dateEcheance: z.string().trim().optional().or(z.literal("")),
  datePaiement: z.string().trim().optional().or(z.literal("")),
  moyenPaiement: z.string().trim().max(50).optional().or(z.literal("")),
});

export type CotisationInput = z.infer<typeof cotisationSchema>;
