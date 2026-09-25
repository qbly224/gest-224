import Link from "next/link";

const NOISE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-start justify-center bg-[#141b13] px-4 py-12 sm:items-center sm:py-20">
      {/* Bureau : halo doux + grain, pour que le fond ne soit pas un simple aplat */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(45,87,65,0.35), transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{ backgroundImage: `url("${NOISE}")` }}
        aria-hidden="true"
      />

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
