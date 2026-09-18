// Next.js appelle register() une fois au démarrage du serveur, avant de
// servir la moindre requête. Valider ici les variables d'environnement
// critiques permet à un déploiement mal configuré d'échouer bruyamment tout
// de suite (logs de démarrage, plateforme qui redémarre le conteneur) plutôt
// qu'au moment de la première connexion d'un client.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const manquantes = ["DATABASE_URL", "SESSION_SECRET", "CHROMIUM_EXECUTABLE_PATH"].filter(
    (nom) => !process.env[nom]
  );
  if (manquantes.length > 0) {
    throw new Error(
      `Variables d'environnement manquantes au démarrage : ${manquantes.join(", ")}.`
    );
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.SESSION_SECRET ===
      "dev-secret-change-me-in-production-please-use-a-long-random-string"
  ) {
    throw new Error(
      "SESSION_SECRET utilise encore la valeur de développement par défaut. " +
        "Générez-en une nouvelle avec `openssl rand -base64 32` avant de démarrer en production."
    );
  }
}
