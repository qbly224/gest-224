import Link from "next/link";

const NOISE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

const RULED_LINES =
  "repeating-linear-gradient(0deg, rgba(246,241,231,0.14) 0, rgba(246,241,231,0.14) 1px, transparent 1px, transparent 20px)";

// Petits papiers du registre qui traînent sur le bureau, en fond — pour que
// le vide autour de la page active ne soit pas un simple aplat, tout en
// restant parlant sur ce que fait Gest-224 (devis, factures, comptabilité).
const PAPIERS = [
  { label: "DEVIS\nN° 2024-014", top: "10%", left: "7%", rotate: -10, delay: "0s", duration: "8s" },
  { label: "FACTURE\nN° 2024-089", top: "62%", left: "9%", rotate: 7, delay: "1.4s", duration: "9s" },
  { label: "AVOIR\nN° 2024-003", top: "18%", left: "84%", rotate: 9, delay: "0.7s", duration: "7.5s" },
  { label: "BON DE LIVRAISON\nN° 2024-051", top: "70%", left: "82%", rotate: -6, delay: "2.1s", duration: "8.5s" },
];

const GLYPHES = [
  { char: "€", top: "34%", left: "14%", size: "2.5rem", delay: "0.3s", duration: "6s" },
  { char: "✓", top: "80%", left: "18%", size: "1.6rem", delay: "1.8s", duration: "7s" },
  { char: "%", top: "46%", left: "88%", size: "1.8rem", delay: "1s", duration: "6.5s" },
  { char: "✓", top: "12%", left: "50%", size: "1.4rem", delay: "2.6s", duration: "7.8s" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-start justify-center bg-[#141b13] px-4 py-12 sm:items-center sm:py-20">
      {/* Le bureau, en fond fixe : halo, grain, papiers et petits repères
          comptables qui dérivent doucement — plus parlant qu'un aplat vide. */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(45,87,65,0.35), transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{ backgroundImage: `url("${NOISE}")` }}
        />

        <div className="hidden sm:block">
          {PAPIERS.map((p, i) => (
            <div
              key={i}
              className="auth-drift absolute h-24 w-20 rounded-[2px] border border-ivoire/10 bg-ivoire/[0.05] p-2 shadow-[0_8px_20px_rgba(0,0,0,0.25)] lg:h-28 lg:w-24"
              style={{
                top: p.top,
                left: p.left,
                backgroundImage: RULED_LINES,
                animationDelay: p.delay,
                animationDuration: p.duration,
                ["--auth-drift-r" as string]: `${p.rotate}deg`,
                transform: `rotate(${p.rotate}deg)`,
              }}
            >
              <span className="whitespace-pre-line font-mono text-[8px] uppercase leading-tight tracking-[0.15em] text-ivoire/35">
                {p.label}
              </span>
            </div>
          ))}

          {GLYPHES.map((g, i) => (
            <span
              key={i}
              className="auth-drift absolute font-titre text-ivoire/[0.09]"
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

          {/* Mini graphique recettes / dépenses, comme sur le tableau de bord */}
          <svg
            className="auth-drift absolute bottom-[8%] left-1/2 h-16 w-28 -translate-x-1/2 opacity-[0.12]"
            style={{ animationDelay: "0.9s", animationDuration: "9s" }}
            viewBox="0 0 100 50"
            fill="none"
          >
            {[8, 22, 14, 30, 20, 38].map((h, i) => (
              <rect
                key={i}
                x={4 + i * 16}
                y={46 - h}
                width="10"
                height={h}
                rx="1"
                fill="#f6f1e7"
              />
            ))}
          </svg>
        </div>
      </div>

      {/* La page de registre */}
      <div className="relative w-full max-w-[440px] -rotate-[0.4deg]">
        {/* Cachet encré */}
        <div className="absolute -top-7 left-1/2 z-10 -translate-x-1/2 rotate-[-4deg]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-[5px] border-double border-encre/80 bg-ivoire text-center font-titre text-[10px] uppercase leading-tight tracking-widest text-encre/80 shadow-md">
            Gest
            <br />
            224
          </div>
        </div>

        {/* Coin corné */}
        <div
          className="pointer-events-none absolute right-0 top-0 z-10"
          style={{
            width: 0,
            height: 0,
            borderStyle: "solid",
            borderWidth: "0 26px 26px 0",
            borderColor: "transparent #e4dac2 transparent transparent",
            filter: "drop-shadow(-2px 2px 3px rgba(0,0,0,0.2))",
          }}
          aria-hidden="true"
        />

        <div
          className="relative overflow-hidden rounded-[2px] bg-ivoire pb-10 pl-10 pr-6 pt-16 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.65)] sm:pl-14 sm:pr-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(31,61,44,0.07) 0, rgba(31,61,44,0.07) 1px, transparent 1px, transparent 42px)",
          }}
        >
          {/* Filet de marge, comme sur un registre comptable */}
          <div
            className="absolute inset-y-0 left-6 w-px bg-[#9c4a3a]/45 sm:left-9"
            aria-hidden="true"
          />
          <div className="relative">{children}</div>
        </div>

        <p className="mt-6 text-center font-sans text-xs text-ivoire/50">
          <Link
            href="/"
            className="underline decoration-ivoire/30 underline-offset-4 hover:text-ivoire/80"
          >
            ← Retour au site
          </Link>
        </p>
      </div>
    </div>
  );
}
