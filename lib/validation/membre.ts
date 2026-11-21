import { z } from "zod";
import { relanceFrequenceSchema } from "@/lib/validation/client";

export const roleMembreSchema = z.enum([
  "president",
  "vice_president",
  "tresorier",
  "secretaire",
  "membre",
]);

export const statutMembreSchema = z.enum(["actif", "suspendu", "radie"]);

export const membreSchema = z.object({
  civilite: z.string().trim().max(20).optional().or(z.literal("")),
  prenom: z.string().trim().min(1, "Le prénom est requis.").max(100),
  nom: z.string().trim().min(1, "Le nom est requis.").max(100),
  email: z.string().trim().email("Adresse email invalide.").max(254).optional().or(z.literal("")),
  telephone: z.string().trim().max(30).optional().or(z.literal("")),

  adresseLigne1: z.string().trim().max(200).optional().or(z.literal("")),
  adresseLigne2: z.string().trim().max(200).optional().or(z.literal("")),
  codePostal: z.string().trim().max(10).optional().or(z.literal("")),
  ville: z.string().trim().max(100).optional().or(z.literal("")),
  pays: z.string().trim().max(100).optional().or(z.literal("")),

  dateAdhesion: z.string().trim().min(1, "La date d'adhésion est requise."),
  role: roleMembreSchema,
  statut: statutMembreSchema,
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  relanceFrequence: relanceFrequenceSchema,
});

export type MembreInput = z.infer<typeof membreSchema>;
