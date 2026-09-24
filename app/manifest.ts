import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gest-224",
    short_name: "Gest-224",
    description: "Gestion commerciale multi-entreprises",
    start_url: "/tableau-de-bord",
    display: "standalone",
    background_color: "#f6f1e7",
    theme_color: "#1f3d2c",
    icons: [
      { src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
