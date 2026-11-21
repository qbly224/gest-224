import { z } from "zod";

// owner n'est jamais invité (c'est le titulaire du compte, créé à l'inscription) ;
// membre reste réservé aux comptes entreprise (accès complet, inchangé).
export const roleInvitationAssociationSchema = z.enum(["tresorier", "communication", "secretaire"]);
export const roleInvitationEntrepriseSchema = z.enum(["membre"]);

export const invitationSchema = z.object({
  nom: z.string().trim().min(1, "Le nom est requis.").max(100),
  prenom: z.string().trim().min(1, "Le prénom est requis.").max(100),
  email: z.string().trim().email("Adresse email invalide.").max(254),
  role: z.string().trim().min(1, "Le rôle est requis."),
});

export type InvitationInput = z.infer<typeof invitationSchema>;
