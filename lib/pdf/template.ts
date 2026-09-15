import "server-only";
import type { Prisma, TypeDocument } from "@prisma/client";
import type { EmetteurSnapshot, ClientSnapshot } from "@/lib/documents/snapshot";
import { nomAffichageClientSnapshot } from "@/lib/documents/snapshot";
import { calculerTotaux } from "@/lib/documents/calc";

export type DocumentAvecLignes = Prisma.DocumentGetPayload<{
  include: {
    lignes: true;
    refDocument: { select: { numero: true; type: true } };
  };
}>;

const TITRES: Record<TypeDocument, string> = {
  devis: "Devis",
  bon_commande: "Bon de commande",
  bon_livraison: "Bon de livraison",
  facture: "Facture",
  facture_acompte: "Facture d'acompte",
  facture_avoir: "Avoir",
};

function escapeHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatEuros(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(d);
}

function adresseHtml(bloc: {
  adresseLigne1: string;
  adresseLigne2: string | null;
  codePostal: string;
  ville: string;
  pays: string;
}): string {
  return [
    escapeHtml(bloc.adresseLigne1),
    bloc.adresseLigne2 ? escapeHtml(bloc.adresseLigne2) : null,
    `${escapeHtml(bloc.codePostal)} ${escapeHtml(bloc.ville)}`,
    bloc.pays && bloc.pays !== "France" ? escapeHtml(bloc.pays) : null,
  ]
    .filter(Boolean)
    .join("<br/>");
}

export function renderDocumentHtml(document: DocumentAvecLignes): string {
  const emetteur = document.emetteurSnapshot as unknown as EmetteurSnapshot;
  const client = document.clientSnapshot as unknown as ClientSnapshot;
  const estFacture = document.type === "facture" || document.type === "facture_acompte";
  const enFranchise = emetteur.regimeTva === "franchise";

  const lignes = document.lignes.map((l) => ({
    quantite: Number(l.quantite),
    prixUnitaireHt: Number(l.prixUnitaireHt),
    tauxTva: l.tauxTva !== null ? Number(l.tauxTva) : null,
    remisePourcentage: Number(l.remisePourcentage),
    montantHt: Number(l.montantHt),
    designation: l.designation,
    description: l.description,
    uniteMesure: l.uniteMesure,
  }));
  const totaux = calculerTotaux(lignes);

  const lignesHtml = lignes
    .map(
      (l) => `
      <tr>
        <td>
          <div class="designation">${escapeHtml(l.designation)}</div>
          ${l.description ? `<div class="description">${escapeHtml(l.description)}</div>` : ""}
        </td>
        <td class="num">${l.quantite}${l.uniteMesure ? ` ${escapeHtml(l.uniteMesure)}` : ""}</td>
        <td class="num">${formatEuros(l.prixUnitaireHt)}</td>
        ${enFranchise ? "" : `<td class="num">${l.tauxTva !== null ? `${l.tauxTva} %` : "—"}</td>`}
        <td class="num">${formatEuros(l.montantHt)}</td>
      </tr>`
    )
    .join("");

  const tvaHtml = enFranchise
    ? `<p class="mention-tva">TVA non applicable, art. 293 B du CGI</p>`
    : totaux.tvaParTaux
        .map(
          (t) =>
            `<div class="ligne-total"><span>TVA ${t.taux} % (base ${formatEuros(t.baseHt)})</span><span>${formatEuros(t.montantTva)}</span></div>`
        )
        .join("");

  const refDocumentHtml = document.refDocument
    ? `<p class="reference">Établi suite au ${TITRES[document.refDocument.type].toLowerCase()} n° ${escapeHtml(document.refDocument.numero)}</p>`
    : "";

  const mentionsPaiementFacture = estFacture
    ? `
      <div class="bloc-paiement">
        <div class="ligne-total"><span>Date d'échéance</span><span>${formatDate(document.dateEcheance)}</span></div>
        ${document.conditionsPaiement ? `<p>${escapeHtml(document.conditionsPaiement)}</p>` : ""}
        <p class="mention-penalites">
          En cas de retard de paiement, des pénalités seront exigibles au taux de
          ${document.tauxPenaliteRetard ? Number(document.tauxPenaliteRetard) : 10} % par an,
          ainsi qu'une indemnité forfaitaire de recouvrement de
          ${formatEuros(document.indemniteForfaitaire ? Number(document.indemniteForfaitaire) : 40)}
          (art. L441-10 du Code de commerce).
        </p>
        ${
          emetteur.iban
            ? `<p class="iban">Paiement par virement — IBAN : ${escapeHtml(emetteur.iban)}${emetteur.bic ? ` — BIC : ${escapeHtml(emetteur.bic)}` : ""}</p>`
            : ""
        }
      </div>`
    : "";

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    color: #1f3d2c;
    background: #f6f1e7;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 11pt;
  }
  .page { padding: 6mm; }
  .entete { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10mm; }
  .titre { font-size: 22pt; letter-spacing: 0.04em; margin: 0; }
  .numero { font-family: "Courier New", monospace; font-size: 12pt; margin-top: 2mm; }
  .statut { font-family: "Courier New", monospace; font-size: 9pt; text-transform: uppercase; color: #1f3d2c99; }
  .reference { font-size: 9pt; font-style: italic; color: #1f3d2c99; }
  .blocs { display: flex; justify-content: space-between; gap: 10mm; margin: 8mm 0; font-family: Arial, sans-serif; font-size: 9.5pt; }
  .bloc { flex: 1; }
  .bloc h2 { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.08em; color: #1f3d2c99; margin: 0 0 2mm; font-family: Arial, sans-serif; }
  .bloc .nom { font-weight: bold; font-size: 11pt; margin-bottom: 1mm; }
  .bloc .detail { color: #1f3d2c; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 9.5pt; margin-top: 4mm; }
  thead th { text-align: left; text-transform: uppercase; font-size: 7.5pt; letter-spacing: 0.05em; color: #1f3d2c99; border-bottom: 1px solid #1f3d2c55; padding: 2mm 2mm; }
  tbody td { border-bottom: 1px solid #1f3d2c22; padding: 3mm 2mm; vertical-align: top; }
  td.num, th.num { text-align: right; font-family: "Courier New", monospace; white-space: nowrap; }
  .designation { font-weight: bold; }
  .description { color: #1f3d2c99; font-size: 8.5pt; margin-top: 1mm; }
  .totaux { margin-top: 6mm; margin-left: auto; width: 75mm; font-family: Arial, sans-serif; font-size: 9.5pt; }
  .ligne-total { display: flex; justify-content: space-between; padding: 1.5mm 0; }
  .ligne-total.ttc { font-weight: bold; font-size: 11pt; border-top: 1px solid #1f3d2c55; margin-top: 1mm; padding-top: 2mm; }
  .mention-tva { font-size: 8.5pt; font-style: italic; text-align: right; margin-top: 2mm; font-family: Arial, sans-serif; }
  .bloc-paiement { margin-top: 10mm; padding-top: 4mm; border-top: 1px solid #1f3d2c33; font-family: Arial, sans-serif; font-size: 9pt; }
  .mention-penalites { color: #1f3d2c99; font-size: 8pt; margin-top: 2mm; }
  .iban { font-family: "Courier New", monospace; margin-top: 2mm; }
  .notes { margin-top: 8mm; font-family: Arial, sans-serif; font-size: 9pt; color: #1f3d2c; white-space: pre-wrap; }
  .pied { margin-top: 12mm; padding-top: 3mm; border-top: 1px solid #1f3d2c33; font-family: Arial, sans-serif; font-size: 7.5pt; color: #1f3d2c99; text-align: center; }
</style>
</head>
<body>
  <div class="page">
    <div class="entete">
      <div>
        <p class="titre">${TITRES[document.type]}</p>
        <p class="numero">${escapeHtml(document.numero)}</p>
        <p class="statut">${escapeHtml(document.statut)}</p>
        ${refDocumentHtml}
      </div>
      <div style="text-align: right; font-family: Arial, sans-serif; font-size: 9.5pt;">
        <div>Émis le ${formatDate(document.dateEmission)}</div>
      </div>
    </div>

    <div class="blocs">
      <div class="bloc">
        <h2>Émetteur</h2>
        <div class="nom">${escapeHtml(emetteur.raisonSociale)}</div>
        <div class="detail">
          ${adresseHtml(emetteur)}<br/>
          SIRET : ${escapeHtml(emetteur.siret)}
          ${emetteur.numeroTvaIntracom ? `<br/>TVA intracom. : ${escapeHtml(emetteur.numeroTvaIntracom)}` : ""}
          ${emetteur.email ? `<br/>${escapeHtml(emetteur.email)}` : ""}
          ${emetteur.telephone ? `<br/>${escapeHtml(emetteur.telephone)}` : ""}
        </div>
      </div>
      <div class="bloc">
        <h2>Client</h2>
        <div class="nom">${escapeHtml(nomAffichageClientSnapshot(client))}</div>
        <div class="detail">
          ${adresseHtml(client)}
          ${client.siret ? `<br/>SIRET : ${escapeHtml(client.siret)}` : ""}
          ${client.numeroTvaIntracom ? `<br/>TVA intracom. : ${escapeHtml(client.numeroTvaIntracom)}` : ""}
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Désignation</th>
          <th class="num">Quantité</th>
          <th class="num">PU HT</th>
          ${enFranchise ? "" : `<th class="num">TVA</th>`}
          <th class="num">Total HT</th>
        </tr>
      </thead>
      <tbody>
        ${lignesHtml}
      </tbody>
    </table>

    <div class="totaux">
      <div class="ligne-total"><span>Total HT</span><span>${formatEuros(totaux.montantHt)}</span></div>
      ${tvaHtml}
      <div class="ligne-total ttc"><span>Total TTC</span><span>${formatEuros(totaux.montantTtc)}</span></div>
    </div>

    ${mentionsPaiementFacture}

    ${document.notes ? `<div class="notes">${escapeHtml(document.notes)}</div>` : ""}

    <div class="pied">
      ${escapeHtml(emetteur.raisonSociale)} — SIRET ${escapeHtml(emetteur.siret)}
      ${emetteur.mentionsLegalesLibres ? ` — ${escapeHtml(emetteur.mentionsLegalesLibres)}` : ""}
    </div>
  </div>
</body>
</html>`;
}
