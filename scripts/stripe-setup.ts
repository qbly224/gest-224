/**
 * Provisionne les deux plans payants de Gest-224 dans Stripe (produits +
 * prix récurrents mensuels), pour éviter de le faire à la main dans le
 * dashboard. Lecture seule sur tout le reste du compte Stripe.
 *
 * Idempotent : si un produit "Gest-224 Starter"/"Gest-224 Pro" existe déjà
 * (recherché par nom), il est réutilisé plutôt que dupliqué - seul un prix
 * manquant est créé.
 *
 * Usage :
 *   STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/stripe-setup.ts
 *
 * Affiche à la fin les deux Price ID à poser en variables d'environnement
 * (STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO) sur Render.
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

  console.log("\nVariables à poser sur Render (Settings > Environment) :");
  console.log(`STRIPE_PRICE_STARTER=${resultats.starter}`);
  console.log(`STRIPE_PRICE_PRO=${resultats.pro}`);
  console.log(
    "\nIl reste à créer le webhook (dashboard Stripe > Developers > Webhooks) pointant vers\n" +
      "https://gest-224.onrender.com/api/stripe/webhook, événements checkout.session.completed\n" +
      "et customer.subscription.deleted, puis poser STRIPE_WEBHOOK_SECRET et STRIPE_SECRET_KEY."
  );
}

main().catch((erreur) => {
  console.error(erreur);
  process.exit(1);
});
