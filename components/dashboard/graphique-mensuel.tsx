import { getTranslations } from "next-intl/server";
import type { MoisAgregat } from "@/lib/comptabilite/agregats";
import { formatEuros as formatEurosLocale } from "@/lib/format";
import { obtenirLocale } from "@/i18n/request";

const COULEUR_RECETTES = "#2a78d6";
const COULEUR_DEPENSES = "#eb6834";

/**
 * Graphique en barres groupées (recettes / dépenses par mois), en SVG
 * statique — pas de bibliothèque de graphiques, pas de JS côté client.
 * L'info-bulle native (<title>) porte le détail exact ; le tableau qui suit
 * ce graphique sur le tableau de bord reste la vue exhaustive.
 */
export async function GraphiqueMensuel({ mois }: { mois: MoisAgregat[] }) {
  const locale = await obtenirLocale();
  const t = await getTranslations("app.dashboard");
  const formatEuros = (n: number) => formatEurosLocale(n, locale);
  const formatCompact = (n: number) =>
    new Intl.NumberFormat(locale === "en" ? "en-US" : "fr-FR", {
      notation: "compact",
      compactDisplay: "short",
    }).format(n);

  const largeurGroupe = 56;
  const largeurBarre = 20;
  const espaceEntreBarres = 2;
  const hauteurZone = 140;
  const margeBas = 24;
  const largeur = mois.length * largeurGroupe;
  const hauteur = hauteurZone + margeBas;

  const maxValeur = Math.max(1, ...mois.flatMap((m) => [m.recettes, m.depenses]));
  const echelle = (v: number) => (v / maxValeur) * (hauteurZone - 8);

  return (
    <div>
      <div className="flex items-center gap-4 font-sans text-xs text-encre/70">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: COULEUR_RECETTES }}
          />
          {t("recettes")}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: COULEUR_DEPENSES }}
          />
          {t("depenses")}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${largeur} ${hauteur}`}
        width="100%"
        height={hauteur}
        className="mt-3 overflow-visible"
        role="img"
        aria-label={`${t("recettes")} / ${t("depenses")}`}
      >
        <line
          x1={0}
          y1={hauteurZone}
          x2={largeur}
          y2={hauteurZone}
          stroke="#1f3d2c"
          strokeOpacity={0.2}
          strokeWidth={1}
        />
        {mois.map((m, i) => {
          const xGroupe = i * largeurGroupe + (largeurGroupe - (largeurBarre * 2 + espaceEntreBarres)) / 2;
          const hRecettes = echelle(m.recettes);
          const hDepenses = echelle(m.depenses);
          return (
            <g key={m.mois}>
              <rect
                x={xGroupe}
                y={hauteurZone - hRecettes}
                width={largeurBarre}
                height={hRecettes}
                rx={4}
                fill={COULEUR_RECETTES}
              >
                <title>{`${m.label} — ${t("recettes")} : ${formatEuros(m.recettes)}`}</title>
              </rect>
              <rect
                x={xGroupe + largeurBarre + espaceEntreBarres}
                y={hauteurZone - hDepenses}
                width={largeurBarre}
                height={hDepenses}
                rx={4}
                fill={COULEUR_DEPENSES}
              >
                <title>{`${m.label} — ${t("depenses")} : ${formatEuros(m.depenses)}`}</title>
              </rect>
              <text
                x={i * largeurGroupe + largeurGroupe / 2}
                y={hauteurZone + 16}
                textAnchor="middle"
                className="fill-encre/60"
                fontSize={9}
                fontFamily="var(--font-inter), sans-serif"
              >
                {m.label.slice(0, 3)}
              </text>
            </g>
          );
        })}
        <text
          x={0}
          y={10}
          className="fill-encre/40"
          fontSize={9}
          fontFamily="var(--font-ibm-plex-mono), monospace"
        >
          {formatCompact(maxValeur)}
        </text>
      </svg>
    </div>
  );
}
