import type { StatutDocument, TypeDocument } from "@prisma/client";

// Types créés/modifiés via le formulaire générique (lignes à quantité
// positive). L'avoir a son propre schéma/actions (quantités négatives) et
// reste, comme la facture, verrouillé dès sa validation - cf. updateAvoir.
type TypeDocumentSaisi = Exclude<TypeDocument, "facture_avoir">;

/**
 * Statuts dans lesquels un document peut encore être modifié. Pour les
 * factures (et acomptes, et avoirs - cf. updateAvoir) : uniquement
 * "brouillon", de façon stricte et non négociable - une fois émise, une
 * facture est une pièce fiscale dont la numérotation et les mentions
 * légales ne doivent plus bouger (inaltérabilité, art. 286-I-3° bis du
 * CGI ; c'est la même exigence qui a motivé le journal d'audit). Corriger
 * une facture déjà envoyée passe par un avoir (cf. creerAvoirDepuisFacture)
 * puis une nouvelle facture corrigée, jamais par une modification directe.
 *
 * Devis/bon de commande/bon de livraison ne sont pas des pièces fiscales :
 * les corriger après un premier envoi (tant qu'aucune décision ultérieure
 * - acceptation, livraison, conversion - n'a été prise dessus) ne pose pas
 * ce problème, donc autorisé.
 *
 * Fichier séparé de lib/actions/documents.ts ("use server") car ce dernier
 * ne peut exporter que des fonctions async - pas une constante.
 */
export const STATUTS_MODIFIABLES: Record<TypeDocumentSaisi, StatutDocument[]> = {
  devis: ["brouillon", "envoye"],
  bon_commande: ["brouillon", "envoye"],
  bon_livraison: ["brouillon", "envoye"],
  facture: ["brouillon"],
  facture_acompte: ["brouillon"],
};
