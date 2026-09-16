import { z } from "zod";

export const regimeTvaSchema = z.enum(["normal", "franchise"]);
export const planSchema = z.enum(["gratuit", "starter", "pro"]);

export const signUpSchema = z.object({
  // Entreprise
  raisonSociale: z.string().trim().min(1, "La raison sociale est requise."),
  plan: planSchema.default("gratuit"),
  siret: z
    .string()
    .trim()
    .regex(/^\d{14}$/, "Le SIRET doit contenir exactement 14 chiffres."),
  regimeTva: regimeTvaSchema,
  adresseLigne1: z.string().trim().min(1, "L'adresse est requise."),
  adresseLigne2: z.string().trim().optional(),
  codePostal: z.string().trim().min(1, "Le code postal est requis."),
  ville: z.string().trim().min(1, "La ville est requise."),
  pays: z.string().trim().min(1).default("France"),

  // Compte utilisateur
  nom: z.string().trim().min(1, "Le nom est requis."),
  prenom: z.string().trim().min(1, "Le prénom est requis."),
  email: z.string().trim().email("Adresse email invalide."),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Adresse email invalide."),
  password: z.string().min(1, "Le mot de passe est requis."),
});

export type LoginInput = z.infer<typeof loginSchema>;
