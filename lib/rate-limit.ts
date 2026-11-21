import "server-only";
import Redis from "ioredis";

// Limiteur partagé via Redis (cf. REDIS_URL, provisionné sur Render) :
// toutes les instances comptent sur le même compteur, condition nécessaire
// dès qu'on est scalé horizontalement (sinon chaque instance aurait son
// propre compteur et la limite globale ne serait plus respectée).
// Repli en mémoire si REDIS_URL n'est pas configurée (développement local
// uniquement - jamais en production, où la variable est toujours présente).

let client: Redis | null = null;

function getClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!client) {
    client = new Redis(url, { maxRetriesPerRequest: 1 });
    client.on("error", (err) => console.error("[rate-limit] Erreur Redis:", err));
  }
  return client;
}

type Fenetre = { compte: number; expiration: number };
const compteursMemoire = new Map<string, Fenetre>();

const intervalle = setInterval(
  () => {
    const maintenant = Date.now();
    for (const [cle, fenetre] of compteursMemoire) {
      if (fenetre.expiration <= maintenant) compteursMemoire.delete(cle);
    }
  },
  5 * 60 * 1000
);
intervalle.unref();

function verifierLimiteMemoire(cle: string, maxTentatives: number, fenetreMs: number): boolean {
  const maintenant = Date.now();
  const existant = compteursMemoire.get(cle);

  if (!existant || existant.expiration <= maintenant) {
    compteursMemoire.set(cle, { compte: 1, expiration: maintenant + fenetreMs });
    return true;
  }
  if (existant.compte >= maxTentatives) return false;

  existant.compte += 1;
  return true;
}

/**
 * Fenêtre fixe : renvoie false si la clé a déjà atteint `maxTentatives`
 * dans les `fenetreMs` dernières millisecondes. INCR+EXPIRE est atomique
 * côté Redis, donc sûr même avec des requêtes concurrentes sur la même clé.
 */
export async function verifierLimite(
  cle: string,
  maxTentatives: number,
  fenetreMs: number
): Promise<boolean> {
  const redis = getClient();
  if (!redis) {
    return verifierLimiteMemoire(cle, maxTentatives, fenetreMs);
  }

  try {
    const cleRedis = `ratelimit:${cle}`;
    const compte = await redis.incr(cleRedis);
    if (compte === 1) {
      await redis.pexpire(cleRedis, fenetreMs);
    }
    return compte <= maxTentatives;
  } catch (err) {
    // Panne Redis : ne jamais bloquer un utilisateur légitime pour une
    // raison d'infrastructure - on autorise, au prix d'une limite non
    // appliquée le temps que Redis revienne.
    console.error("[rate-limit] Erreur Redis, limite non appliquée:", err);
    return true;
  }
}
