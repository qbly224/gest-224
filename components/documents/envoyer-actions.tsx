"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatEuros as formatEurosLocale } from "@/lib/format";
import type { Locale } from "@/i18n/config";

export function EnvoyerActions({
  envoyerAction,
  numero,
  titre,
  montantTtc,
  clientEmail,
  clientTelephone,
  raisonSociale,
  masquerMontant = false,
}: {
  envoyerAction: () => Promise<void>;
  numero: string;
  titre: string;
  montantTtc: number;
  clientEmail: string | null;
  clientTelephone: string | null;
  raisonSociale: string;
  masquerMontant?: boolean;
}) {
  const t = useTranslations("app.envoyerActions");
  const locale = useLocale() as Locale;
  const [ouvert, setOuvert] = useState(false);
  const [isPending, startTransition] = useTransition();
  const conteneurRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    function surClicExterieur(e: MouseEvent) {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    }
    document.addEventListener("mousedown", surClicExterieur);
    return () => document.removeEventListener("mousedown", surClicExterieur);
  }, [ouvert]);

  const sujet = t("emailSujet", { titre, numero, raisonSociale });
  const mentionMontant = masquerMontant
    ? ""
    : t("emailMontant", { montant: formatEurosLocale(montantTtc, locale) });
  const corps = t("emailCorps", {
    titre: titre.toLowerCase(),
    numero,
    mentionMontant,
    raisonSociale,
  });

  function marquerEnvoye() {
    startTransition(() => {
      envoyerAction();
    });
  }

  function envoyerParGmail() {
    const url = new URL("https://mail.google.com/mail/?view=cm&fs=1");
    if (clientEmail) url.searchParams.set("to", clientEmail);
    url.searchParams.set("su", sujet);
    url.searchParams.set("body", corps);
    marquerEnvoye();
    window.open(url.toString(), "_blank", "noopener,noreferrer");
    setOuvert(false);
  }

  function envoyerParWhatsapp() {
    const numeroPropre = clientTelephone ? clientTelephone.replace(/[^\d+]/g, "").replace(/^\+/, "") : "";
    const texte = `${sujet}\n\n${corps}`;
    const url = numeroPropre
      ? `https://wa.me/${numeroPropre}?text=${encodeURIComponent(texte)}`
      : `https://wa.me/?text=${encodeURIComponent(texte)}`;
    marquerEnvoye();
    window.open(url, "_blank", "noopener,noreferrer");
    setOuvert(false);
  }

  return (
    <div className="relative inline-block" ref={conteneurRef}>
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        disabled={isPending}
        className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light disabled:opacity-60"
      >
        {t("envoyer")}
      </button>
      {ouvert && (
        <div className="absolute right-0 z-10 mt-1 w-56 rounded-sm border border-encre/20 bg-ivoire shadow-lg">
          <p className="border-b border-encre/10 px-4 py-2 font-sans text-xs text-encre/75">
            {t("telechargezDabord")}
          </p>
          <button
            type="button"
            onClick={envoyerParGmail}
            className="block w-full px-4 py-2 text-left font-sans text-sm text-encre hover:bg-encre/5"
          >
            {t("parGmail")}
          </button>
          <button
            type="button"
            onClick={envoyerParWhatsapp}
            className="block w-full px-4 py-2 text-left font-sans text-sm text-encre hover:bg-encre/5"
          >
            {t("parWhatsapp")}
          </button>
        </div>
      )}
    </div>
  );
}
