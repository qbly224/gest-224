"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { PlanAbonnement } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getStripe, appUrl } from "@/lib/stripe";
import { estPlanValide, stripePriceId } from "@/lib/plans";

/**
 * Crée une session Stripe Checkout pour un tenant qui n'a pas encore
 * d'abonnement actif. Réutilisée à la fois par la page /abonnement et par
 * l'inscription (choix d'un plan payant dès la création du compte).
 */
export async function creerUrlCheckout(
  tenantId: string,
  email: string,
  plan: PlanAbonnement,
  stripeCustomerId: string | null
): Promise<string> {
  const priceId = stripePriceId(plan);
  if (!priceId) {
    throw new Error(`Aucun Price Stripe configuré pour le plan "${plan}".`);
  }

  const stripe = getStripe();
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: tenantId,
    customer: stripeCustomerId ?? undefined,
    customer_email: stripeCustomerId ? undefined : email,
    subscription_data: { metadata: { tenantId } },
    metadata: { tenantId, plan },
    success_url: `${appUrl()}/abonnement?paiement=succes`,
    cancel_url: `${appUrl()}/abonnement?paiement=annule`,
  });

  if (!checkoutSession.url) {
    throw new Error("Stripe n'a pas renvoyé d'URL de paiement.");
  }
  return checkoutSession.url;
}

/**
 * Sélection d'un plan payant depuis /abonnement : nouvel abonnement (via
 * Checkout) si le tenant n'en a pas encore, sinon mise à jour directe de
 * l'abonnement existant (changement de Price, proratisé par Stripe) — ne
 * jamais créer un second abonnement Stripe pour le même tenant.
 */
export async function choisirPlanPaye(formData: FormData): Promise<void> {
  const session = await requireSession();
  const plan = formData.get("plan");
  if (typeof plan !== "string" || !estPlanValide(plan) || plan === "gratuit") return;

  const [tenant, user] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId } }),
    prisma.user.findUniqueOrThrow({ where: { id: session.userId } }),
  ]);

  if (!tenant.stripeSubscriptionId) {
    const url = await creerUrlCheckout(tenant.id, user.email, plan, tenant.stripeCustomerId);
    redirect(url);
  }

  const priceId = stripePriceId(plan);
  if (!priceId) {
    throw new Error(`Aucun Price Stripe configuré pour le plan "${plan}".`);
  }

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(tenant.stripeSubscriptionId);
  const itemId = subscription.items.data[0]?.id;
  if (!itemId) {
    throw new Error("Abonnement Stripe sans ligne facturable.");
  }

  await stripe.subscriptions.update(tenant.stripeSubscriptionId, {
    items: [{ id: itemId, price: priceId }],
    proration_behavior: "create_prorations",
  });

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { plan, paiementValide: true },
  });

  revalidatePath("/abonnement");
  revalidatePath("/tableau-de-bord");
}

/**
 * Choix d'un plan payant réglé en espèces / virement, hors Stripe : le
 * plan est appliqué immédiatement mais reste bloqué en écriture
 * (paiementValide=false, cf. lib/paiement-guard.ts) tant qu'un
 * administrateur ne l'a pas validé depuis /admin.
 */
export async function demanderPlanEspeces(formData: FormData): Promise<void> {
  const session = await requireSession();
  const plan = formData.get("plan");
  if (typeof plan !== "string" || !estPlanValide(plan) || plan === "gratuit") return;

  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: { plan, paiementValide: false },
  });

  revalidatePath("/abonnement");
  revalidatePath("/tableau-de-bord");
}

/** Repasse au plan gratuit en résiliant l'abonnement Stripe actif, s'il y en a un. */
export async function annulerAbonnement(): Promise<void> {
  const session = await requireSession();
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId } });

  if (tenant.stripeSubscriptionId) {
    const stripe = getStripe();
    await stripe.subscriptions.cancel(tenant.stripeSubscriptionId).catch((err) => {
      // Déjà annulé côté Stripe (ex. webhook plus rapide) : on continue quand
      // même la mise à jour locale plutôt que de bloquer l'utilisateur.
      if (!(err instanceof Error) || !err.message.includes("No such subscription")) {
        throw err;
      }
    });
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { plan: "gratuit", stripeSubscriptionId: null, paiementValide: true },
  });

  revalidatePath("/abonnement");
  revalidatePath("/tableau-de-bord");
}

/** Portail Stripe hébergé : moyen de paiement, factures, annulation en libre-service. */
export async function ouvrirPortailFacturation(): Promise<void> {
  const session = await requireSession();
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId } });
  if (!tenant.stripeCustomerId) {
    redirect("/abonnement");
  }

  const stripe = getStripe();
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: tenant.stripeCustomerId,
    return_url: `${appUrl()}/abonnement`,
  });
  redirect(portalSession.url);
}
