import type { MetadataRoute } from "next";

const BASE_URL = "https://gest-224.onrender.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/tableau-de-bord",
        "/devis",
        "/bons-commande",
        "/bons-livraison",
        "/factures",
        "/factures-acompte",
        "/avoirs",
        "/clients",
        "/catalogue",
        "/depenses",
        "/recettes",
        "/rapport",
        "/entreprise",
        "/abonnement",
        "/admin",
        "/recherche",
        "/api",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
