import type { ChampTriDocument } from "@/lib/documents/filtres";

type ParametresConserves = {
  q?: string;
  statut?: string;
  depuis?: string;
  jusqua?: string;
};

/** Construit le lien de tri d'une colonne, en conservant les filtres actifs. */
export function lienTri(
  params: ParametresConserves,
  champ: ChampTriDocument,
  triActuel?: string,
  ordreActuel?: string
): string {
  const nouvelOrdre = triActuel === champ && ordreActuel === "asc" ? "desc" : "asc";
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.statut) sp.set("statut", params.statut);
  if (params.depuis) sp.set("depuis", params.depuis);
  if (params.jusqua) sp.set("jusqua", params.jusqua);
  sp.set("tri", champ);
  sp.set("ordre", nouvelOrdre);
  return `?${sp.toString()}`;
}

export function flecheTri(champ: ChampTriDocument, triActuel?: string, ordreActuel?: string): string {
  if (triActuel !== champ) return "";
  return ordreActuel === "asc" ? " ↑" : " ↓";
}
