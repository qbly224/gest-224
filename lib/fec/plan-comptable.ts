/**
 * Comptes du Plan Comptable Général (PCG) utilisés par défaut pour générer
 * le FEC. Gest-224 ne tient pas de comptabilité d'engagement (pas de grand
 * livre, pas de lettrage, pas de ventilation par nature de dépense au-delà
 * du libellé libre saisi par l'utilisateur) : ces comptes sont donc des
 * valeurs par défaut raisonnables, PAS une comptabilité certifiée. Le texte
 * d'avertissement affiché avec l'export (voir app/(app)/rapport/page.tsx)
 * doit toujours rappeler qu'un expert-comptable doit valider ou corriger
 * cette ventilation avant tout usage face à l'administration fiscale.
 */
export const COMPTE_BANQUE = { numero: "512000", libelle: "Banque" };
export const COMPTE_VENTES = { numero: "706000", libelle: "Prestations de services" };
export const COMPTE_CLIENTS = { numero: "411000", libelle: "Clients" };
export const COMPTE_TVA_COLLECTEE = { numero: "445710", libelle: "TVA collectée" };
// Compte de charge générique : la catégorie libre de la dépense est
// reportée telle quelle dans le libellé de l'écriture pour que la
// réaffectation par l'expert-comptable reste possible sans ressaisie.
export const COMPTE_CHARGES_DIVERSES = { numero: "606100", libelle: "Achats non stockés de fournitures" };
