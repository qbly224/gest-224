import type { MetadataRoute } from "next";

const BASE_URL = "https://gest-224.onrender.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: "", priority: 1 },
    { path: "/a-propos", priority: 0.6 },
    { path: "/tarifs", priority: 0.8 },
    { path: "/connexion", priority: 0.3 },
    { path: "/inscription", priority: 0.5 },
    { path: "/cgu", priority: 0.2 },
    { path: "/cgv", priority: 0.2 },
    { path: "/confidentialite", priority: 0.2 },
    { path: "/mentions-legales", priority: 0.2 },
  ];

  return pages.map(({ path, priority }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    priority,
  }));
}
