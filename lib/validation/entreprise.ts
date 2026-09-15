import { z } from "zod";
import { regimeTvaSchema } from "@/lib/validation/auth";

export const entrepriseSchema = z.object({
  raisonSociale: z.string().trim().min(1, "La raison sociale est requise."),
  formeJuridique: z.string().trim().optional().or(z.literal("")),
  siret: z
    .string()
    .trim()
    .regex(/^\d{14}$/, "Le SIRET doit contenir exactement 14 chiffres."),
  siren: z.string().trim().optional().or(z.literal("")),
  numeroTvaIntracom: z.string().trim().optional().or(z.literal("")),
  regimeTva: regimeTvaSchema,
  capitalSocial: z.coerce.number().nonnegative().optional().nullable(),

  adresseLigne1: z.string().trim().min(1, "L'adresse est requise."),
  adresseLigne2: z.string().trim().optional().or(z.literal("")),
  codePostal: z.string().trim().min(1, "Le code postal est requis."),
  ville: z.string().trim().min(1, "La ville est requise."),
  pays: z.string().trim().min(1, "Le pays est requis."),

  email: z.string().trim().email("Adresse email invalide.").optional().or(z.literal("")),
  telephone: z.string().trim().optional().or(z.literal("")),

  iban: z.string().trim().optional().or(z.literal("")),
  bic: z.string().trim().optional().or(z.literal("")),

  mentionsLegalesLibres: z.string().trim().optional().or(z.literal("")),
});

export type EntrepriseInput = z.infer<typeof entrepriseSchema>;
