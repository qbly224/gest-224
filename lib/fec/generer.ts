import "server-only";
import { prisma } from "@/lib/prisma";
import {
  COMPTE_BANQUE,
  COMPTE_VENTES,
  COMPTE_CLIENTS,
  COMPTE_TVA_COLLECTEE,
  COMPTE_CHARGES_DIVERSES,
} from "./plan-comptable";

const COLONNES_FEC = [
  "JournalCode",
  "JournalLib",
  "EcritureNum",
  "EcritureDate",
  "CompteNum",
  "CompteLib",
  "CompAuxNum",
  "CompAuxLib",
  "PieceRef",
  "PieceDate",
  "EcritureLib",
  "Debit",
  "Credit",
  "EcritureLet",
  "DateLet",
  "ValidDate",
  "Montantdevise",
  "Idevise",
] as const;

type LigneFec = {
  journalCode: string;
  journalLib: string;
  ecritureNum: string;
  ecritureDate: Date;
  compteNum: string;
  compteLib: string;
  pieceRef: string;
  pieceDate: Date;
  ecritureLib: string;
  debit: number;
  credit: number;
};

function formatDateFec(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function formatMontant(n: number): string {
  return n.toFixed(2);
}

function ligneVersTexte(l: LigneFec): string {
  return [
    l.journalCode,
    l.journalLib,
    l.ecritureNum,
    formatDateFec(l.ecritureDate),
    l.compteNum,
    l.compteLib,
    "",
    "",
    l.pieceRef,
    formatDateFec(l.pieceDate),
    l.ecritureLib,
    formatMontant(l.debit),
    formatMontant(l.credit),
    "",
    "",
    formatDateFec(l.ecritureDate),
    "",
    "",
  ].join("\t");
}

/**
 * Génère le FEC (Fichier des Écritures Comptables) sur une période donnée,
 * en comptabilité de trésorerie (cohérent avec le reste de Gest-224, qui ne
 * tient pas de grand livre d'engagement) : une écriture par recette
 * encaissée, une par avoir émis, une par dépense. Voir plan-comptable.ts
 * pour les limites de cette ventilation par défaut.
 */
export async function genererFec(
  tenantId: string,
  dateDebut: Date,
  dateFin: Date
): Promise<{ contenu: string; nbEcritures: number }> {
  const [recettes, avoirs, depenses] = await Promise.all([
    prisma.recette.findMany({
      where: { tenantId, datePaiement: { gte: dateDebut, lte: dateFin } },
      include: { document: true },
      orderBy: { datePaiement: "asc" },
    }),
    prisma.document.findMany({
      where: {
        tenantId,
        type: "facture_avoir",
        statut: { not: "brouillon" },
        dateEmission: { gte: dateDebut, lte: dateFin },
      },
      orderBy: { dateEmission: "asc" },
    }),
    prisma.depense.findMany({
      where: { tenantId, date: { gte: dateDebut, lte: dateFin } },
      orderBy: { date: "asc" },
    }),
  ]);

  const lignes: LigneFec[] = [];
  let compteur = 0;
  const prochainNumero = (prefixe: string) => `${prefixe}${String(++compteur).padStart(5, "0")}`;

  for (const recette of recettes) {
    const numero = prochainNumero("VE");
    const montantHt = Number(recette.document.montantHt);
    const montantTva = Number(recette.document.montantTva);
    const montantTtc = Number(recette.montant);
    const libelle = `Encaissement ${recette.document.numero}`;

    lignes.push({
      journalCode: "VE",
      journalLib: "Journal des ventes",
      ecritureNum: numero,
      ecritureDate: recette.datePaiement,
      compteNum: COMPTE_BANQUE.numero,
      compteLib: COMPTE_BANQUE.libelle,
      pieceRef: recette.document.numero,
      pieceDate: recette.document.dateEmission,
      ecritureLib: libelle,
      debit: montantTtc,
      credit: 0,
    });
    lignes.push({
      journalCode: "VE",
      journalLib: "Journal des ventes",
      ecritureNum: numero,
      ecritureDate: recette.datePaiement,
      compteNum: COMPTE_VENTES.numero,
      compteLib: COMPTE_VENTES.libelle,
      pieceRef: recette.document.numero,
      pieceDate: recette.document.dateEmission,
      ecritureLib: libelle,
      debit: 0,
      credit: montantHt,
    });
    if (montantTva > 0) {
      lignes.push({
        journalCode: "VE",
        journalLib: "Journal des ventes",
        ecritureNum: numero,
        ecritureDate: recette.datePaiement,
        compteNum: COMPTE_TVA_COLLECTEE.numero,
        compteLib: COMPTE_TVA_COLLECTEE.libelle,
        pieceRef: recette.document.numero,
        pieceDate: recette.document.dateEmission,
        ecritureLib: libelle,
        debit: 0,
        credit: montantTva,
      });
    }
  }

  // Avoir : aucun encaissement/décaissement suivi par l'application, donc
  // comptabilisé à l'émission comme une réduction de créance client (pas
  // comme une sortie de banque, qu'on ne peut pas prouver avoir eu lieu).
  for (const avoir of avoirs) {
    const numero = prochainNumero("VE");
    const montantHt = Math.abs(Number(avoir.montantHt));
    const montantTva = Math.abs(Number(avoir.montantTva));
    const montantTtc = Math.abs(Number(avoir.montantTtc));
    const libelle = `Avoir ${avoir.numero}`;

    lignes.push({
      journalCode: "VE",
      journalLib: "Journal des ventes",
      ecritureNum: numero,
      ecritureDate: avoir.dateEmission,
      compteNum: COMPTE_VENTES.numero,
      compteLib: COMPTE_VENTES.libelle,
      pieceRef: avoir.numero,
      pieceDate: avoir.dateEmission,
      ecritureLib: libelle,
      debit: montantHt,
      credit: 0,
    });
    if (montantTva > 0) {
      lignes.push({
        journalCode: "VE",
        journalLib: "Journal des ventes",
        ecritureNum: numero,
        ecritureDate: avoir.dateEmission,
        compteNum: COMPTE_TVA_COLLECTEE.numero,
        compteLib: COMPTE_TVA_COLLECTEE.libelle,
        pieceRef: avoir.numero,
        pieceDate: avoir.dateEmission,
        ecritureLib: libelle,
        debit: montantTva,
        credit: 0,
      });
    }
    lignes.push({
      journalCode: "VE",
      journalLib: "Journal des ventes",
      ecritureNum: numero,
      ecritureDate: avoir.dateEmission,
      compteNum: COMPTE_CLIENTS.numero,
      compteLib: COMPTE_CLIENTS.libelle,
      pieceRef: avoir.numero,
      pieceDate: avoir.dateEmission,
      ecritureLib: libelle,
      debit: 0,
      credit: montantTtc,
    });
  }

  for (const depense of depenses) {
    const numero = prochainNumero("AC");
    const montant = Number(depense.montant);
    const libelle = depense.categorie ? `${depense.categorie} – ${depense.libelle}` : depense.libelle;

    lignes.push({
      journalCode: "AC",
      journalLib: "Journal des achats",
      ecritureNum: numero,
      ecritureDate: depense.date,
      compteNum: COMPTE_CHARGES_DIVERSES.numero,
      compteLib: COMPTE_CHARGES_DIVERSES.libelle,
      pieceRef: depense.id.slice(0, 8),
      pieceDate: depense.date,
      ecritureLib: libelle,
      debit: montant,
      credit: 0,
    });
    lignes.push({
      journalCode: "AC",
      journalLib: "Journal des achats",
      ecritureNum: numero,
      ecritureDate: depense.date,
      compteNum: COMPTE_BANQUE.numero,
      compteLib: COMPTE_BANQUE.libelle,
      pieceRef: depense.id.slice(0, 8),
      pieceDate: depense.date,
      ecritureLib: libelle,
      debit: 0,
      credit: montant,
    });
  }

  const entetes = COLONNES_FEC.join("\t");
  const corps = lignes.map(ligneVersTexte).join("\r\n");
  const contenu = `${entetes}\r\n${corps}${lignes.length > 0 ? "\r\n" : ""}`;

  return { contenu, nbEcritures: compteur };
}

export function nomFichierFec(siret: string, siren: string | null, dateFin: Date): string {
  const sirenEffectif = siren ?? siret.slice(0, 9);
  const date = formatDateFec(dateFin);
  return `${sirenEffectif}FEC${date}.txt`;
}
