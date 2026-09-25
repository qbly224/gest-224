"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "gest224-cookies-ack";
export const OUVRIR_COOKIES_EVENT = "gest224:open-cookie-prefs";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }

    const reouvrir = () => setVisible(true);
    window.addEventListener(OUVRIR_COOKIES_EVENT, reouvrir);
    return () => window.removeEventListener(OUVRIR_COOKIES_EVENT, reouvrir);
  }, []);

  if (!visible) return null;

  const fermer = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // localStorage indisponible (navigation privée, etc.) : on referme quand même.
    }
    setVisible(false);
  };

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-encre bg-ivoire px-4 py-4 shadow-[0_-10px_30px_rgba(0,0,0,0.15)] sm:px-6"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="font-sans text-sm text-encre/80">
          Gest-224 utilise uniquement un cookie de session strictement
          nécessaire à la connexion à votre espace — aucun cookie publicitaire
          ni de mesure d&apos;audience.{" "}
          <Link href="/confidentialite" className="underline">
            En savoir plus
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={fermer}
          className="shrink-0 border-2 border-encre bg-encre px-5 py-2 font-sans text-sm font-medium text-ivoire transition-colors hover:bg-encre-light"
        >
          J&apos;ai compris
        </button>
      </div>
    </div>
  );
}
