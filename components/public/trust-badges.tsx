import { getTranslations } from "next-intl/server";
import { ShieldCheck, MapPin, EyeOff, CircleOff } from "lucide-react";

const BADGES = [
  { cle: "rgpd", Icon: ShieldCheck },
  { cle: "hebergementUe", Icon: MapPin },
  { cle: "sansCookiePub", Icon: EyeOff },
  { cle: "sansCarte", Icon: CircleOff },
] as const;

export async function TrustBadges() {
  const t = await getTranslations("public.confiance");

  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
      {BADGES.map(({ cle, Icon }, i) => (
        <li key={cle} className="flex items-center gap-2 font-sans text-xs text-encre/60">
          <Icon
            size={14}
            strokeWidth={1.75}
            className={i === 0 ? "badge-pulse-dot text-encre/70" : "text-encre/50"}
          />
          {t(cle)}
        </li>
      ))}
    </ul>
  );
}
