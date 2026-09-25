// Styles du registre — variante distincte des champs de formulaire standards
// (lib/ui.ts), réservée aux pages d'authentification : champs "à écrire sur
// la ligne" plutôt qu'encadrés, pour prolonger le cachet + filet de marge du
// layout (app/(auth)/layout.tsx).

export const ledgerLabelClass =
  "block font-mono text-[10px] uppercase tracking-[0.2em] text-encre/45";

export const ledgerInputClass =
  "w-full border-0 border-b-2 border-encre/15 bg-transparent px-0 py-2 font-mono text-[15px] text-encre placeholder:text-encre/25 focus:border-encre focus:outline-none focus:ring-0";

export const ledgerSelectClass =
  "w-full border-0 border-b-2 border-encre/15 bg-transparent px-0 py-2 font-sans text-sm text-encre focus:border-encre focus:outline-none focus:ring-0";

export const ledgerErrorClass =
  "border-l-2 border-[#9c4a3a] bg-[#9c4a3a]/5 px-3 py-2 font-sans text-sm text-[#7a3226]";

export const ledgerNoticeClass =
  "border-l-2 border-encre/30 bg-encre/5 px-3 py-2 font-sans text-sm text-encre";
