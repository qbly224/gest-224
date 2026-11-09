/**
 * URL publique du site, utilisée pour les métadonnées SEO (sitemap,
 * robots.txt, Open Graph, canonical) et les liens envoyés par email.
 * Contrairement à lib/stripe.ts#appUrl(), ne lève jamais d'erreur si
 * APP_URL est absente - ces usages ne doivent pas faire planter un build
 * ou une génération de page, une valeur de repli suffit.
 */
export const SITE_URL = (process.env.APP_URL ?? "https://gest-224.fr").replace(/\/+$/, "");
