/**
 * Provisionne Stripe pour Gest-224 : les deux plans payants (produits +
 * prix récurrents mensuels) et le webhook applicatif, pour éviter de le
 * faire à la main dans le dashboard.
 *
 * Idempotent : un produit/prix/webhook déjà présent (recherché par nom ou
 * URL) est réutilisé plutôt que dupliqué.
 *
 * Usage :
 *   STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/stripe-setup.ts
 *
 * Affiche à la fin les 4 variables à poser sur Render (Settings >
 * Environment) : STRIPE_SECRET_KEY (déjà en main), STRIPE_WEBHOOK_SECRET,
 * STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO.
 *
 * Le secret du webhook n'est renvoyé par Stripe qu'à sa création : si un
 * webhook pour cette URL existe déjà, il faut régénérer son secret depuis
 * le dashboard (Developers > Webhooks > sélectionner l'endpoint > Roll
 * secret) plutôt que de pouvoir le relire ici.
 */
import Stripe from "stripe";
import { PLANS } from "../lib/plans";

async function trouverOuCreerProduit(stripe: Stripe, nom: string): Promise<Stripe.Product> {
  const existants = await stripe.products.search({ query: `name:"${nom}" AND active:"true"` });
  if (existants.data[0]) return existants.data[0];
  return stripe.products.create({ name: nom });
}

async function trouverOuCreerPrix(
  stripe: Stripe,
  produit: Stripe.Product,
  montantCentimes: number
): Promise<Stripe.Price> {
  const prix = await stripe.prices.list({ product: produit.id, active: true, limit: 100 });
  const existant = prix.data.find(
    (p) => p.unit_amount === montantCentimes && p.currency === "eur" && p.recurring?.interval === "month"
  );
  if (existant) return existant;
  return stripe.prices.create({
    product: produit.id,
    currency: "eur",
    unit_amount: montantCentimes,
    recurring: { interval: "month" },
  });
}

const URL_WEBHOOK = "https://gest-224.onrender.com/api/stripe/webhook";
const EVENEMENTS_WEBHOOK: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  "checkout.session.completed",
  "customer.subscription.deleted",
];

async function trouverOuCreerWebhook(
  stripe: Stripe
): Promise<{ id: string; secret: string | null }> {
  const existants = await stripe.webhookEndpoints.list({ limit: 100 });
  const existant = existants.data.find((w) => w.url === URL_WEBHOOK);
  if (existant) return { id: existant.id, secret: null };

  const cree = await stripe.webhookEndpoints.create({
    url: URL_WEBHOOK,
    enabled_events: EVENEMENTS_WEBHOOK,
  });
  return { id: cree.id, secret: cree.secret ?? null };
}

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("STRIPE_SECRET_KEY n'est pas définie dans l'environnement.");
    process.exit(1);
  }
  const stripe = new Stripe(secretKey);

  const resultats: Record<string, string> = {};
  for (const plan of [PLANS.starter, PLANS.pro]) {
    const produit = await trouverOuCreerProduit(stripe, `Gest-224 ${plan.label}`);
    const prix = await trouverOuCreerPrix(stripe, produit, plan.prixMensuel * 100);
    resultats[plan.id] = prix.id;
    console.log(`${plan.label} : produit ${produit.id}, prix ${prix.id} (${plan.prixMensuel} €/mois)`);
  }

  const webhook = await trouverOuCreerWebhook(stripe);
  if (webhook.secret) {
    console.log(`Webhook ${webhook.id} créé pour ${URL_WEBHOOK}`);
  } else {
    console.log(
      `Webhook ${webhook.id} existait déjà pour ${URL_WEBHOOK} - son secret n'est pas ` +
        "re-affichable ; régénère-le depuis le dashboard (Roll secret) si besoin."
    );
  }

  console.log("\nVariables à poser sur Render (Settings > Environment) :");
  console.log(`STRIPE_PRICE_STARTER=${resultats.starter}`);
  console.log(`STRIPE_PRICE_PRO=${resultats.pro}`);
  if (webhook.secret) console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
}

main().catch((erreur) => {
  console.error(erreur);
  process.exit(1);
});
