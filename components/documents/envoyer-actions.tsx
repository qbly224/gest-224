"use client";

import { useEffect, useRef, useState, useTransition } from "react";

function formatEuros(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

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

  const sujet = `${titre} ${numero} — ${raisonSociale}`;
  const mentionMontant = masquerMontant ? "" : ` d'un montant de ${formatEuros(montantTtc)}`;
  const corps = `Bonjour,\n\nVeuillez trouver ci-joint ${titre.toLowerCase()} n° ${numero}${mentionMontant}.\nPensez à joindre le PDF téléchargé avant l'envoi.\n\nCordialement,\n${raisonSociale}`;

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
        Envoyer
      </button>
      {ouvert && (
        <div className="absolute right-0 z-10 mt-1 w-56 rounded-sm border border-encre/20 bg-ivoire shadow-lg">
          <p className="border-b border-encre/10 px-4 py-2 font-sans text-xs text-encre/60">
            Téléchargez d&apos;abord le PDF pour le joindre.
          </p>
          <button
            type="button"
            onClick={envoyerParGmail}
            className="block w-full px-4 py-2 text-left font-sans text-sm text-encre hover:bg-encre/5"
          >
            Par Gmail
          </button>
          <button
            type="button"
            onClick={envoyerParWhatsapp}
            className="block w-full px-4 py-2 text-left font-sans text-sm text-encre hover:bg-encre/5"
          >
            Par WhatsApp
          </button>
        </div>
      )}
    </div>
  );
}
