function echapperChamp(valeur: string): string {
  if (/[",\n;]/.test(valeur)) {
    return `"${valeur.replace(/"/g, '""')}"`;
  }
  return valeur;
}

export function genererCsv(entetes: string[], lignes: (string | number | null | undefined)[][]): string {
  const rangs = [entetes, ...lignes.map((ligne) => ligne.map((v) => (v ?? "").toString()))];
  const corps = rangs.map((rangee) => rangee.map(echapperChamp).join(";")).join("\r\n");
  // BOM UTF-8 pour qu'Excel détecte l'encodage et affiche correctement les accents.
  return `﻿${corps}\r\n`;
}

export function reponseCsv(contenu: string, nomFichier: string): Response {
  return new Response(contenu, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomFichier}"`,
    },
  });
}
