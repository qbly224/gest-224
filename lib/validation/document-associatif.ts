import { z } from "zod";

export const categorieDocumentAssociatifSchema = z.enum([
  "statuts",
  "reglement_interieur",
  "proces_verbal",
  "rapport_activite",
  "administratif",
  "autre",
]);

export const documentAssociatifSchema = z.object({
  categorie: categorieDocumentAssociatifSchema,
  titre: z.string().trim().min(1, "Le titre est requis.").max(200),
});

export type DocumentAssociatifInput = z.infer<typeof documentAssociatifSchema>;
