import Link from "next/link";
import { masquerOnboarding } from "@/lib/actions/abonnement";

export type EtapeOnboarding = {
  label: string;
  fait: boolean;
  href: string;
};

export function OnboardingChecklist({ etapes }: { etapes: EtapeOnboarding[] }) {
  const toutesFaites = etapes.every((e) => e.fait);
  if (toutesFaites) return null;

  return (
    <div className="rounded-sm border border-encre/20 bg-white/40 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-titre text-lg text-encre">Bien démarrer</h2>
        <form action={masquerOnboarding}>
          <button
            type="submit"
            className="font-sans text-xs text-encre/50 hover:text-encre hover:underline"
          >
            Masquer ce guide
          </button>
        </form>
      </div>
      <ul className="mt-4 space-y-2 font-sans text-sm">
        {etapes.map((etape) => (
          <li key={etape.label} className="flex items-center gap-3">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-xs ${
                etape.fait
                  ? "border-encre bg-encre text-ivoire"
                  : "border-encre/30 text-encre/40"
              }`}
            >
              {etape.fait ? "✓" : ""}
            </span>
            {etape.fait ? (
              <span className="text-encre/50 line-through">{etape.label}</span>
            ) : (
              <Link href={etape.href} className="text-encre underline">
                {etape.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
