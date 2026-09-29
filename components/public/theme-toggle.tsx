"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const CLE_STOCKAGE = "gest224-theme-public";

export function ThemeToggle() {
  const [sombre, setSombre] = useState(false);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    let initial = false;
    try {
      const stocke = window.localStorage.getItem(CLE_STOCKAGE);
      initial = stocke
        ? stocke === "dark"
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      // Stockage indisponible (navigation privée...) : reste en thème clair.
    }
    setSombre(initial);
    setPret(true);
  }, []);

  useEffect(() => {
    if (!pret) return;
    const racine = document.getElementById("site-public");
    if (racine) racine.dataset.theme = sombre ? "dark" : "light";
    try {
      window.localStorage.setItem(CLE_STOCKAGE, sombre ? "dark" : "light");
    } catch {
      // Rien à faire si le stockage est indisponible.
    }
  }, [sombre, pret]);

  return (
    <button
      type="button"
      onClick={() => setSombre((v) => !v)}
      aria-label={sombre ? "Passer au thème clair" : "Passer au thème sombre"}
      className="rounded-sm p-2 text-encre/70 transition-colors hover:bg-encre/5 hover:text-encre"
    >
      {sombre ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}
    </button>
  );
}
