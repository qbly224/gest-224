const LIGNES_REGLURE =
  "repeating-linear-gradient(0deg, currentColor 0, currentColor 1px, transparent 1px, transparent 20px)";

const PAPIERS = [
  { label: "DEVIS\nN° 2026-014", top: "12%", left: "4%", rotate: -9, delay: "0s", duration: "8s" },
  { label: "FACTURE\nN° 2026-089", top: "66%", left: "6%", rotate: 6, delay: "1.4s", duration: "9s" },
  { label: "AVOIR\nN° 2026-003", top: "16%", left: "90%", rotate: 8, delay: "0.7s", duration: "7.5s" },
];

const GLYPHES = [
  { char: "€", top: "30%", left: "12%", size: "2.2rem", delay: "0.3s", duration: "6s" },
  { char: "✓", top: "78%", left: "16%", size: "1.4rem", delay: "1.8s", duration: "7s" },
  { char: "%", top: "40%", left: "92%", size: "1.6rem", delay: "1s", duration: "6.5s" },
];

/**
 * Décor discret derrière le hero de l'accueil, dans le même esprit que le
 * bureau animé de la page de connexion (papiers/glyphes qui dérivent), mais
 * en très faible opacité pour rester lisible et ne pas concurrencer le
 * titre. Purement CSS : aucune interactivité, donc pas besoin d'un
 * composant client.
 */
export function DecorHero() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden text-encre" aria-hidden="true">
      {PAPIERS.map((p, i) => (
        <div
          key={i}
          className="auth-drift absolute hidden h-24 w-20 rounded-[2px] border border-encre/10 bg-encre/[0.03] p-2 sm:block"
          style={{
            top: p.top,
            left: p.left,
            backgroundImage: LIGNES_REGLURE,
            color: "currentColor",
            opacity: 0.5,
            animationDelay: p.delay,
            animationDuration: p.duration,
            ["--auth-drift-r" as string]: `${p.rotate}deg`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        >
          <span className="whitespace-pre-line font-mono text-[8px] uppercase leading-tight tracking-[0.15em] text-encre/40">
            {p.label}
          </span>
        </div>
      ))}

      {GLYPHES.map((g, i) => (
        <span
          key={i}
          className="auth-drift absolute font-titre text-encre/[0.08]"
          style={{
            top: g.top,
            left: g.left,
            fontSize: g.size,
            animationDelay: g.delay,
            animationDuration: g.duration,
          }}
        >
          {g.char}
        </span>
      ))}
    </div>
  );
}
