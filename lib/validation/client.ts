import { z } from "zod";

export const typeClientSchema = z.enum(["particulier", "professionnel"]);

export const clientSchema = z
  .object({
    type: typeClientSchema,

    raisonSociale: z.string().trim().optional().or(z.literal("")),
    siret: z.string().trim().optional().or(z.literal("")),
    numeroTvaIntracom: z.string().trim().optional().or(z.literal("")),

    civilite: z.string().trim().optional().or(z.literal("")),
    nom: z.string().trim().optional().or(z.literal("")),
    prenom: z.string().trim().optional().or(z.literal("")),

    adresseLigne1: z.string().trim().min(1, "L'adresse est requise."),
    adresseLigne2: z.string().trim().optional().or(z.literal("")),
    codePostal: z.string().trim().min(1, "Le code postal est requis."),
    ville: z.string().trim().min(1, "La ville est requise."),
    pays: z.string().trim().min(1, "Le pays est requis."),

    email: z.string().trim().email("Adresse email invalide.").optional().or(z.literal("")),
    telephone: z.string().trim().optional().or(z.literal("")),
    notes: z.string().trim().optional().or(z.literal("")),
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
