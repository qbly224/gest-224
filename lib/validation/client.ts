import { z } from "zod";

export const typeClientSchema = z.enum(["particulier", "professionnel"]);

export const clientSchema = z
  .object({
    type: typeClientSchema,

    raisonSociale: z.string().trim().max(200).optional().or(z.literal("")),
    siret: z.string().trim().max(14).optional().or(z.literal("")),
    numeroTvaIntracom: z.string().trim().max(50).optional().or(z.literal("")),

    civilite: z.string().trim().max(20).optional().or(z.literal("")),
    nom: z.string().trim().max(100).optional().or(z.literal("")),
    prenom: z.string().trim().max(100).optional().or(z.literal("")),

    adresseLigne1: z.string().trim().min(1, "L'adresse est requise.").max(200),
    adresseLigne2: z.string().trim().max(200).optional().or(z.literal("")),
    codePostal: z.string().trim().min(1, "Le code postal est requis.").max(10),
    ville: z.string().trim().min(1, "La ville est requise.").max(100),
    pays: z.string().trim().min(1, "Le pays est requis.").max(100),

    email: z.string().trim().email("Adresse email invalide.").max(254).optional().or(z.literal("")),
    telephone: z.string().trim().max(30).optional().or(z.literal("")),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.type === "professionnel" && !data.raisonSociale) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["raisonSociale"],
        message: "La raison sociale est requise pour un client professionnel.",
      });
    }
    if (data.type === "particulier" && !data.nom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nom"],
        message: "Le nom est requis pour un client particulier.",
      });
    }
  });

export type ClientInput = z.infer<typeof clientSchema>;
