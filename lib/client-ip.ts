import "server-only";
import { headers } from "next/headers";

/**
 * Meilleur effort : dépend d'un en-tête posé par le reverse proxy devant
 * l'application (`x-forwarded-for`). Sans proxy de confiance devant, cet
 * en-tête est falsifiable par le client — acceptable ici puisqu'il ne sert
 * qu'à répartir des compteurs de limitation de débit, pas à une décision de
 * sécurité binaire.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}
