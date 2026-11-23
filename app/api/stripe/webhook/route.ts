import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { estPlanValide } from "@/lib/plans";
import { enregistrerEchecPaiement, resoudreEchecPaiement } from "@/lib/paiement-echec";

// Depuis la restructuration de l'API Invoices (versions Stripe récentes),
// l'abonnement source n'est plus sur invoice.subscription mais nesté sous
// invoice.parent.subscription_details.subscription.
function idAbonnementFacture(invoice: Stripe.Invoice): string | null {
  const details = invoice.parent?.subscription_details;
  if (!details?.subscription) return null;
  return typeof details.subscription === "string" ? details.subscription : details.subscription.id;
}

/**
 * Source de vérité pour `Tenant.plan` une fois le paiement branché : ni la
 * page /abonnement ni aucune autre action n'écrit `plan` pour un
 * changement payant sans passer par ici (ou par lib/actions/paiement.ts,
 * qui reflète le même état que Stripe vient de confirmer).
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Webhook Stripe non configuré." }, { status: 500 });
  }

  const payload = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      const tenantId = checkoutSession.client_reference_id ?? checkoutSession.metadata?.tenantId;
      const plan = checkoutSession.metadata?.plan;
      const customerId =
        typeof checkoutSession.customer === "string"
          ? checkoutSession.customer
          : checkoutSession.customer?.id;
      const subscriptionId =
        typeof checkoutSession.subscription === "string"
          ? checkoutSession.subscription
          : checkoutSession.subscription?.id;

      if (tenantId && plan && estPlanValide(plan) && customerId && subscriptionId) {
        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            plan,
            paiementValide: true,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
          },
        });
      }
      break;
    }

    // Couvre l'annulation programmée depuis le portail Stripe (l'utilisateur
    // n'a pas besoin de repasser par l'app) et, en filet de sécurité, tout
    // abonnement qui expire sans avoir été résilié via annulerAbonnement().
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const tenantId = subscription.metadata?.tenantId;
      if (tenantId) {
        await prisma.tenant.updateMany({
          where: { id: tenantId, stripeSubscriptionId: subscription.id },
          data: { plan: "gratuit", stripeSubscriptionId: null, paiementValide: true },
        });
      }
      break;
    }

    // Renouvellement mensuel refusé (carte expirée/refusée...). Ne bloque
    // rien tout de suite : enregistrerEchecPaiement() relance par email et
    // démarre le délai de grâce, bloquerAbonnementsEnEchec() (job planifié)
    // s'occupe du blocage effectif une fois le 5 du mois dépassé.
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = idAbonnementFacture(invoice);
      if (subscriptionId) {
        const tenant = await prisma.tenant.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
          select: { id: true },
        });
        if (tenant) await enregistrerEchecPaiement(tenant.id);
      }
      break;
    }

    // Reprise après un ou plusieurs échecs (carte mise à jour, nouvelle
    // tentative Stripe réussie...) : efface l'échec en cours et redonne
    // l'accès complet immédiatement, sans attendre le prochain 5 du mois.
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = idAbonnementFacture(invoice);
      if (subscriptionId) {
        const tenant = await prisma.tenant.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
          select: { id: true },
        });
        if (tenant) await resoudreEchecPaiement(tenant.id);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
