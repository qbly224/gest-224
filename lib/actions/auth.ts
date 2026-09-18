"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { createSession, destroySession } from "@/lib/session";
import { signUpSchema, loginSchema } from "@/lib/validation/auth";
import { verifierLimite } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";
import type { ActionState } from "@/lib/actions/types";

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
          plan: data.plan,
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
