import "server-only";

// Limiteur en mémoire, par processus — suffisant pour le déploiement à une
// seule instance documenté dans le README. À remplacer par un store partagé
// (Redis ou équivalent) si l'application est scalée horizontalement, sinon
// chaque instance aurait son propre compteur et la limite globale ne serait
// plus respectée.

type Fenetre = { compte: number; expiration: number };

const compteurs = new Map<string, Fenetre>();

// Purge périodique pour éviter une fuite mémoire lente sur un process
// long-vivant (les entrées expirées ne sont sinon jamais retirées de la Map).
const intervalle = setInterval(
  () => {
    const maintenant = Date.now();
    for (const [cle, fenetre] of compteurs) {
      if (fenetre.expiration <= maintenant) compteurs.delete(cle);
    }
  },
  5 * 60 * 1000
);
intervalle.unref();

/**
 * Fenêtre glissante simple : renvoie false si la clé a déjà atteint
 * `maxTentatives` dans les `fenetreMs` dernières millisecondes.
 */
export function verifierLimite(
  cle: string,
  maxTentatives: number,
  fenetreMs: number
): boolean {
  const maintenant = Date.now();
  const existant = compteurs.get(cle);

  if (!existant || existant.expiration <= maintenant) {
    compteurs.set(cle, { compte: 1, expiration: maintenant + fenetreMs });
    return true;
  }

  if (existant.compte >= maxTentatives) {
    return false;
  }

  existant.compte += 1;
  return true;
}
