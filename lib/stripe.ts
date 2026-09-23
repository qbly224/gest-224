import "server-only";
import Stripe from "stripe";

let stripeClient: Stripe | null = null;

/**
 * Client Stripe paresseux : évite de faire planter le boot de l'app si
 * STRIPE_SECRET_KEY est absente (paiement non encore configuré) — l'erreur
 * n'apparaît que si une action qui en a réellement besoin est déclenchée.
 */
export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY n'est pas définie — le paiement des abonnements n'est pas configuré."
      );
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function appUrl(): string {
  const url = process.env.APP_URL;
  if (!url) throw new Error("APP_URL n'est pas défini.");
  return url.replace(/\/+$/, "");
}
