import { z } from "zod";

export const regimeTvaSchema = z.enum(["normal", "franchise"]);
export const planSchema = z.enum(["gratuit", "starter", "pro"]);

export const signUpSchema = z.object({
  // Entreprise
  raisonSociale: z.string().trim().min(1, "La raison sociale est requise.").max(200),
  plan: planSchema.default("gratuit"),
  siret: z
    .string()
    .trim()
    .regex(/^\d{14}$/, "Le SIRET doit contenir exactement 14 chiffres."),
  regimeTva: regimeTvaSchema,
  adresseLigne1: z.string().trim().min(1, "L'adresse est requise.").max(200),
  adresseLigne2: z.string().trim().max(200).optional(),
  codePostal: z.string().trim().min(1, "Le code postal est requis.").max(10),
  ville: z.string().trim().min(1, "La ville est requise.").max(100),
  pays: z.string().trim().min(1).max(100).default("France"),

  // Compte utilisateur
  nom: z.string().trim().min(1, "Le nom est requis.").max(100),
  prenom: z.string().trim().min(1, "Le prénom est requis.").max(100),
  email: z.string().trim().email("Adresse email invalide.").max(254),
  // bcrypt ignore silencieusement tout au-delà de 72 octets : borner ici
  // rend la limite explicite plutôt que de laisser deviner un mot de passe
  // tronqué sans le savoir.
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
    .max(72, "Le mot de passe ne peut pas dépasser 72 caractères."),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Adresse email invalide.").max(254),
  password: z.string().min(1, "Le mot de passe est requis.").max(72),
});

export type LoginInput = z.infer<typeof loginSchema>;
