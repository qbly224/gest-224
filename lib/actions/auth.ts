"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { createSession, destroySession } from "@/lib/session";
import { signUpSchema, loginSchema } from "@/lib/validation/auth";
import type { ActionState } from "@/lib/actions/types";

export async function signUp(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    raisonSociale: formData.get("raisonSociale"),
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

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.actif) {
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
