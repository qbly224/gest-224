"use client";

import { useEffect, useRef, useState } from "react";

const DUREE_MS = 1400;

export function CompteurAnime({ valeur, suffixe = "" }: { valeur: number; suffixe?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [affiche, setAffiche] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAffiche(valeur);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const debut = performance.now();
        const animer = (maintenant: number) => {
          const progres = Math.min((maintenant - debut) / DUREE_MS, 1);
          // Ease-out cubique : démarre vite, ralentit en fin de course.
          const facteur = 1 - Math.pow(1 - progres, 3);
          setAffiche(Math.round(valeur * facteur));
          if (progres < 1) requestAnimationFrame(animer);
        };
        requestAnimationFrame(animer);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [valeur]);

  return (
    <span ref={ref} className="font-mono tabular-nums">
      {new Intl.NumberFormat("fr-FR").format(affiche)}
      {suffixe}
    </span>
  );
}
