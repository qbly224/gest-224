import { z } from "zod";

export const annonceSchema = z.object({
  titre: z.string().trim().min(1, "Le titre est requis.").max(200),
  contenu: z.string().trim().min(1, "Le contenu est requis.").max(5000),
});

export type AnnonceInput = z.infer<typeof annonceSchema>;
