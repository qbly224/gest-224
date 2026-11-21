import "server-only";

function escapeHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatEuros(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(d);
}

export type RecuEmetteur = {
  raisonSociale: string;
  numeroRna: string | null;
  siret: string | null;
  adresseLigne1: string;
  adresseLigne2: string | null;
  codePostal: string;
  ville: string;
  pays: string;
};

/**
 * Reçu générique (cotisation ou don/subvention) - document non fiscal
 * (contrairement aux factures), régénéré à la demande à partir des données
 * actuelles : pas de snapshot figé nécessaire.
 */
export function renderRecuHtml(params: {
  titre: string;
  numero: string;
  emetteur: RecuEmetteur;
  nomBeneficiaire: string;
  montant: number;
  date: Date;
  objet: string;
  moyenPaiement?: string | null;
}): string {
  const { titre, numero, emetteur, nomBeneficiaire, montant, date, objet, moyenPaiement } = params;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; color: #1f3d2c; font-family: Georgia, "Times New Roman", serif; }
  .page { width: 180mm; margin: 0 auto; padding: 14mm 0; }
  .titre { font-size: 20pt; margin: 0; }
  .numero { font-family: "Courier New", monospace; font-size: 11pt; margin-top: 2mm; color: #1f3d2c99; }
  .entete { border-bottom: 1px solid #1f3d2c33; padding-bottom: 6mm; margin-bottom: 8mm; }
  .bloc { font-family: Arial, sans-serif; font-size: 9.5pt; margin-top: 6mm; }
  .bloc h2 { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.08em; color: #1f3d2c99; margin: 0 0 2mm; font-family: Arial, sans-serif; }
  .detail { line-height: 1.6; }
  .corps { margin-top: 10mm; font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.8; }
  .montant { font-family: "Courier New", monospace; font-size: 16pt; font-weight: bold; margin-top: 6mm; }
  .pied { margin-top: 16mm; padding-top: 4mm; border-top: 1px solid #1f3d2c33; font-family: Arial, sans-serif; font-size: 7.5pt; color: #1f3d2c99; text-align: center; }
</style>
</head>
<body>
  <div class="page">
    <div class="entete">
      <p class="titre">${escapeHtml(titre)}</p>
      <p class="numero">${escapeHtml(numero)}</p>
    </div>

    <div class="bloc">
      <h2>Émis par</h2>
      <div class="detail">
        ${escapeHtml(emetteur.raisonSociale)}<br/>
        ${escapeHtml(emetteur.adresseLigne1)}${emetteur.adresseLigne2 ? `<br/>${escapeHtml(emetteur.adresseLigne2)}` : ""}<br/>
        ${escapeHtml(emetteur.codePostal)} ${escapeHtml(emetteur.ville)}
        ${emetteur.siret ? `<br/>SIRET : ${escapeHtml(emetteur.siret)}` : ""}
        ${emetteur.numeroRna ? `<br/>RNA : ${escapeHtml(emetteur.numeroRna)}` : ""}
      </div>
    </div>

    <div class="corps">
      Reçu de <strong>${escapeHtml(nomBeneficiaire)}</strong><br/>
      Objet : ${escapeHtml(objet)}<br/>
      Date : ${formatDate(date)}
      ${moyenPaiement ? `<br/>Moyen de paiement : ${escapeHtml(moyenPaiement)}` : ""}
    </div>

    <p class="montant">${formatEuros(montant)}</p>

    <div class="pied">
      ${escapeHtml(emetteur.raisonSociale)}${emetteur.siret ? ` - SIRET ${escapeHtml(emetteur.siret)}` : ""}${emetteur.numeroRna ? ` - RNA ${escapeHtml(emetteur.numeroRna)}` : ""}
    </div>
  </div>
</body>
</html>`;
}
