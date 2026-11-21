import { z } from "zod";
import { regimeTvaSchema } from "@/lib/validation/auth";
import { MOYENS_PAIEMENT } from "@/lib/paiement-moyens";

export const entrepriseSchema = z.object({
  raisonSociale: z.string().trim().min(1, "La raison sociale est requise.").max(200),
  formeJuridique: z.string().trim().max(100).optional().or(z.literal("")),
  // Optionnel ici (contrairement à l'inscription) : un compte association
  // peut ne jamais en avoir, et un compte entreprise existant en a déjà un
  // de toute façon (saisi à l'inscription, cf. lib/validation/auth.ts).
  siret: z
    .string()
    .trim()
    .regex(/^\d{14}$/, "Le SIRET doit contenir exactement 14 chiffres.")
    .optional()
    .or(z.literal("")),
  numeroRna: z.string().trim().max(20).optional().or(z.literal("")),
  siren: z.string().trim().max(9).optional().or(z.literal("")),
  numeroTvaIntracom: z.string().trim().max(50).optional().or(z.literal("")),
  // Optionnel : non présenté/non pertinent pour un compte association (cf.
  // components/entreprise/entreprise-form.tsx), qui n'a pas de régime de
  // TVA à proprement parler.
  regimeTva: regimeTvaSchema.optional(),
  capitalSocial: z.coerce.number().nonnegative().max(999_999_999_999).optional().nullable(),

  adresseLigne1: z.string().trim().min(1, "L'adresse est requise.").max(200),
  adresseLigne2: z.string().trim().max(200).optional().or(z.literal("")),
  codePostal: z.string().trim().min(1, "Le code postal est requis.").max(10),
  ville: z.string().trim().min(1, "La ville est requise.").max(100),
  pays: z.string().trim().min(1, "Le pays est requis.").max(100),

  email: z.string().trim().email("Adresse email invalide.").max(254).optional().or(z.literal("")),
  telephone: z.string().trim().max(30).optional().or(z.literal("")),

  iban: z.string().trim().max(34).optional().or(z.literal("")),
  bic: z.string().trim().max(11).optional().or(z.literal("")),
  moyensPaiementAcceptes: z.array(z.enum(MOYENS_PAIEMENT)).default([]),

  mentionsLegalesLibres: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type EntrepriseInput = z.infer<typeof entrepriseSchema>;
