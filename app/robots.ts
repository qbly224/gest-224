import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

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
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
