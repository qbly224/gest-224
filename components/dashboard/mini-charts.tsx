// Petits graphiques décoratifs mais réels (données du tenant) pour les
// tuiles du tableau de bord — SVG statique, pas de bibliothèque de
// graphiques, pas de JS côté client.

export function MiniBarres({ valeurs, couleur }: { valeurs: number[]; couleur: string }) {
  const largeurBarre = 6;
  const espace = 3;
  const largeur = valeurs.length * (largeurBarre + espace);
  const hauteur = 40;
  const max = Math.max(1, ...valeurs);

  return (
    <svg viewBox={`0 0 ${largeur} ${hauteur}`} width={largeur} height={hauteur} aria-hidden="true">
      {valeurs.map((v, i) => {
        const h = Math.max(2, (v / max) * hauteur);
        return (
          <rect
            key={i}
            x={i * (largeurBarre + espace)}
            y={hauteur - h}
            width={largeurBarre}
            height={h}
            rx={2}
            fill={couleur}
            opacity={i === valeurs.length - 1 ? 1 : 0.55}
          />
        );
      })}
    </svg>
  );
}

export function MiniLigne({ valeurs, couleur }: { valeurs: number[]; couleur: string }) {
  const largeur = 100;
  const hauteur = 40;
  const max = Math.max(1, ...valeurs);
  const min = Math.min(0, ...valeurs);
  const etendue = max - min || 1;
  const pas = largeur / Math.max(1, valeurs.length - 1);

  const points = valeurs.map((v, i) => {
    const x = i * pas;
    const y = hauteur - ((v - min) / etendue) * (hauteur - 4) - 2;
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${largeur} ${hauteur}`} width={largeur} height={hauteur} aria-hidden="true">
      <polyline points={points.join(" ")} fill="none" stroke={couleur} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function MiniDonut({
  valeur,
  total,
  couleur,
  couleurFond = "#e8e4d8",
}: {
  valeur: number;
  total: number;
  couleur: string;
  couleurFond?: string;
}) {
  const taille = 40;
  const rayon = 15;
  const epaisseur = 6;
  const circonference = 2 * Math.PI * rayon;
  const fraction = total > 0 ? valeur / total : 0;
  const centre = taille / 2;

  return (
    <svg viewBox={`0 0 ${taille} ${taille}`} width={taille} height={taille} aria-hidden="true">
      <circle cx={centre} cy={centre} r={rayon} fill="none" stroke={couleurFond} strokeWidth={epaisseur} />
      <circle
        cx={centre}
        cy={centre}
        r={rayon}
        fill="none"
        stroke={couleur}
        strokeWidth={epaisseur}
        strokeDasharray={`${circonference * fraction} ${circonference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${centre} ${centre})`}
      />
    </svg>
  );
}

export function BarreProgression({ fraction, couleur }: { fraction: number; couleur: string }) {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-encre/10">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: couleur }} />
    </div>
  );
}
