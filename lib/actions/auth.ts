"use server";

import { randomBytes, createHash } from "crypto";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { createSession, destroySession } from "@/lib/session";
import {
  signUpSchema,
  loginSchema,
  demandeResetSchema,
  reinitialiserMotDePasseSchema,
} from "@/lib/validation/auth";
import { verifierLimite } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";
import { envoyerEmail } from "@/lib/email";
import { creerUrlCheckout } from "@/lib/actions/paiement";
import type { ActionState } from "@/lib/actions/types";

const DUREE_TOKEN_RESET_MS = 60 * 60 * 1000; // 1 heure

function hasherToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Hash bcrypt fixe (mot de passe arbitraire, non secret) utilisé pour que la
// comparaison prenne le même temps que pour un compte existant, même quand
// l'email n'existe pas — sans ça, l'absence de comparaison bcrypt sur un
// email inconnu rend le temps de réponse distinguable et permet d'énumérer
// les comptes enregistrés.
const HASH_FACTICE = "$2b$12$/fqFA9DHUx7uqv4XnoBCa.IvB52eq4/Tem7TTORGVqOkUe6nr3BuC";

export async function signUp(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ip = await getClientIp();
  // Limite large : freine la création massive de comptes (chaque inscription
  // coûte un hash bcrypt-12 ≈ 300 ms de CPU) sans gêner un usage normal.
  if (!verifierLimite(`signup:${ip}`, 10, 60 * 60 * 1000)) {
    return { error: "Trop de tentatives d'inscription. Réessayez plus tard." };
  }

  const parsed = signUpSchema.safeParse({
    raisonSociale: formData.get("raisonSociale"),
    plan: formData.get("plan") || undefined,
    siret: formData.get("siret"),
    regimeTva: formData.get("regimeTva"),
    adresseLigne1: formData.get("adresseLigne1"),
    adresseLigne2: formData.get("adresseLigne2") || undefined,
    codePostal: formData.get("codePostal"),
    ville: formData.get("ville"),
    pays: formData.get("pays") || "France",
    nom: formData.get("nom"),
    prenom: formData.get("prenom"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  const [emailExists, siretExists] = await Promise.all([
    prisma.user.findUnique({ where: { email: data.email } }),
    prisma.tenant.findUnique({ where: { siret: data.siret } }),
  ]);

  if (emailExists) {
    return { fieldErrors: { email: ["Cette adresse email est déjà utilisée."] } };
  }
  if (siretExists) {
    return { fieldErrors: { siret: ["Ce SIRET est déjà enregistré."] } };
  }

  const passwordHash = await hashPassword(data.password);

  let created;
  try {
    created = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          raisonSociale: data.raisonSociale,
          // Toujours créé en gratuit : un plan payant choisi sur la page
          // tarifs n'est appliqué qu'après paiement réel (redirection vers
          // Stripe Checkout juste après la création de session ci-dessous),
          // jamais directement ici — sans quoi n'importe qui pourrait
          // s'inscrire directement sur Pro sans jamais payer.
          plan: "gratuit",
          siret: data.siret,
          regimeTva: data.regimeTva,
          adresseLigne1: data.adresseLigne1,
          adresseLigne2: data.adresseLigne2 || null,
          codePostal: data.codePostal,
          ville: data.ville,
          pays: data.pays,
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: data.email,
          passwordHash,
          nom: data.nom,
          prenom: data.prenom,
          role: "owner",
        },
      });

      // Un client et un article de démonstration, désactivables comme
      // n'importe quelle fiche, pour que le nouvel utilisateur voie tout de
      // suite à quoi ressemble l'app sans avoir à d'abord tout créer à la
      // main. Pas de devis de démo : les documents ne sont jamais
      // supprimables (traçabilité comptable) et compteraient dans le quota
      // mensuel du plan gratuit — un cadeau empoisonné pour qui débute.
      await tx.client.create({
        data: {
          tenantId: tenant.id,
          type: "professionnel",
          raisonSociale: "Client de démonstration (à modifier ou désactiver)",
          adresseLigne1: "1 rue de la Démonstration",
          codePostal: "75000",
          ville: "Paris",
          pays: "France",
        },
      });

      await tx.article.create({
        data: {
          tenantId: tenant.id,
          type: "service",
          designation: "Prestation de démonstration (à modifier ou désactiver)",
          uniteMesure: "unité",
          prixUnitaireHt: 100,
          tauxTva: data.regimeTva === "normal" ? 20 : null,
        },
      });

      return { tenant, user };
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { error: "Cette entreprise ou cette adresse email existe déjà." };
    }
    throw err;
  }

  await createSession({
    userId: created.user.id,
    tenantId: created.tenant.id,
    role: created.user.role,
  });

  if (data.plan !== "gratuit") {
    try {
      const url = await creerUrlCheckout(created.tenant.id, data.email, data.plan, null);
      redirect(url);
    } catch (err) {
      // Le compte est déjà créé (en gratuit) et la session déjà ouverte :
      // on ne bloque jamais l'inscription pour un souci de configuration
      // du paiement. L'utilisateur peut réessayer de passer au plan payant
      // depuis /abonnement une fois connecté.
      if (
        err &&
        typeof err === "object" &&
        "digest" in err &&
        typeof err.digest === "string" &&
        err.digest.startsWith("NEXT_REDIRECT")
      ) {
        throw err;
      }
      redirect("/tableau-de-bord?erreurPaiement=1");
    }
  }

  redirect("/tableau-de-bord");
}

export async function signIn(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email, password } = parsed.data;
  const ip = await getClientIp();

  // Deux limites indépendantes : par IP (freine le brute-force distribué sur
  // de nombreux comptes) et par email (freine le bourrage d'identifiants
  // ciblé sur un seul compte depuis plusieurs IP).
  if (
    !verifierLimite(`login-ip:${ip}`, 20, 15 * 60 * 1000) ||
    !verifierLimite(`login-email:${email.toLowerCase()}`, 8, 15 * 60 * 1000)
  ) {
    return { error: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Même en l'absence de compte, on effectue une comparaison bcrypt (contre
  // un hash factice) pour que le temps de réponse ne permette pas de
  // distinguer un email inconnu d'un email existant.
  if (!user || !user.actif) {
    await verifyPassword(password, HASH_FACTICE);
    return { error: "Email ou mot de passe incorrect." };
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    return { error: "Email ou mot de passe incorrect." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createSession({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
  });

  redirect("/tableau-de-bord");
}

export async function signOut(): Promise<void> {
  await destroySession();
  redirect("/connexion");
}

/**
 * Toujours le même message de succès, que l'email existe ou non : sinon ce
 * formulaire deviendrait un moyen d'énumérer les comptes enregistrés.
 */
export async function demanderReinitialisation(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = demandeResetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { email } = parsed.data;
  const ip = await getClientIp();

  const succesGenerique: ActionState = { success: true };

  if (
    !verifierLimite(`reset-ip:${ip}`, 10, 60 * 60 * 1000) ||
    !verifierLimite(`reset-email:${email.toLowerCase()}`, 3, 60 * 60 * 1000)
  ) {
    // On ne révèle pas la limitation : même message générique.
    return succesGenerique;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.actif) {
    return succesGenerique;
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = hasherToken(token);

  await prisma.$transaction([
    // Invalide toute demande précédente encore active pour cet utilisateur :
    // un seul lien de réinitialisation valide à la fois.
    prisma.resetMotDePasse.updateMany({
      where: { userId: user.id, utilise: false },
      data: { utilise: true },
    }),
    prisma.resetMotDePasse.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expireA: new Date(Date.now() + DUREE_TOKEN_RESET_MS),
      },
    }),
  ]);

  const lien = `${process.env.APP_URL ?? "http://localhost:3000"}/reinitialiser-mot-de-passe/${token}`;
  await envoyerEmail(
    email,
    "Réinitialisation de votre mot de passe Gest-224",
    `Vous avez demandé la réinitialisation de votre mot de passe.\n\n` +
      `Ce lien est valable une heure :\n${lien}\n\n` +
      `Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`
  );

  return succesGenerique;
}

export async function reinitialiserMotDePasse(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = reinitialiserMotDePasseSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { token, password } = parsed.data;

  const reset = await prisma.resetMotDePasse.findUnique({
    where: { token: hasherToken(token) },
  });

  if (!reset || reset.utilise || reset.expireA < new Date()) {
    return { error: "Ce lien de réinitialisation est invalide ou a expiré." };
  }

  const passwordHash = await hashPassword(password);
  const maintenant = new Date();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: reset.userId },
      data: { passwordHash, passwordChangedAt: maintenant },
    }),
    prisma.resetMotDePasse.update({
      where: { id: reset.id },
      data: { utilise: true },
    }),
  ]);

  redirect("/connexion?reinitialise=1");
}
