"use server";

import { randomBytes, createHash } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { RoleUtilisateur } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { envoyerEmail } from "@/lib/email";
import { enregistrerAudit } from "@/lib/audit";
import { withToast } from "@/lib/toast";
import { invitationSchema } from "@/lib/validation/equipe";
import type { ActionState } from "@/lib/actions/types";

const DUREE_TOKEN_INVITATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

function hasherToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const ROLES_INVITABLES: Record<"entreprise" | "association", RoleUtilisateur[]> = {
  entreprise: [RoleUtilisateur.membre],
  association: [RoleUtilisateur.tresorier, RoleUtilisateur.communication, RoleUtilisateur.secretaire],
};

async function exigerOwner() {
  const session = await requireSession();
  if (session.role !== "owner") {
    redirect(withToast("/tableau-de-bord", "Seul le titulaire du compte peut gérer l'équipe."));
  }
  return session;
}

export async function inviterMembreEquipe(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await exigerOwner();

  const parsed = invitationSchema.safeParse({
    nom: formData.get("nom"),
    prenom: formData.get("prenom"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: session.tenantId },
    select: { typeCompte: true, raisonSociale: true },
  });
  const rolesAutorises = ROLES_INVITABLES[tenant.typeCompte];
  if (!rolesAutorises.includes(data.role as RoleUtilisateur)) {
    return { fieldErrors: { role: ["Rôle invalide pour ce type de compte."] } };
  }

  const emailExistant = await prisma.user.findUnique({ where: { email: data.email } });
  if (emailExistant) {
    return { fieldErrors: { email: ["Cette adresse email est déjà utilisée."] } };
  }

  // Mot de passe placeholder inutilisable : la connexion n'est possible
  // qu'après définition d'un mot de passe via le lien d'invitation (même
  // mécanisme que reinitialiserMotDePasse, cf. lib/actions/auth.ts).
  const passwordHash = await hashPassword(randomBytes(32).toString("hex"));

  const token = randomBytes(32).toString("hex");
  const tokenHash = hasherToken(token);

  const utilisateur = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        tenantId: session.tenantId,
        email: data.email,
        passwordHash,
        nom: data.nom,
        prenom: data.prenom,
        role: data.role as RoleUtilisateur,
        actif: true,
      },
    });
    await tx.resetMotDePasse.create({
      data: {
        userId: u.id,
        token: tokenHash,
        expireA: new Date(Date.now() + DUREE_TOKEN_INVITATION_MS),
      },
    });
    return u;
  });

  await enregistrerAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: "equipe.invite",
    entite: "user",
    entiteId: utilisateur.id,
    details: { email: data.email, role: data.role },
  });

  const lien = `${process.env.APP_URL ?? "http://localhost:3000"}/reinitialiser-mot-de-passe/${token}`;
  try {
    await envoyerEmail(
      data.email,
      `Invitation à rejoindre ${tenant.raisonSociale} sur UniGest`,
      `Vous avez été invité·e à rejoindre ${tenant.raisonSociale} sur UniGest.\n\n` +
        `Définissez votre mot de passe pour activer votre compte (lien valable 7 jours) :\n${lien}\n\n` +
        `Si vous ne vous attendiez pas à cette invitation, ignorez cet email.`
    );
  } catch (err) {
    console.error("[equipe] Échec de l'envoi de l'email d'invitation:", err);
  }

  revalidatePath("/equipe");
  redirect(withToast("/equipe", "Invitation envoyée."));
}

export async function changerRoleMembreEquipe(
  userId: string,
  formData: FormData
): Promise<void> {
  const session = await exigerOwner();
  if (userId === session.userId) return;

  const role = formData.get("role");
  if (typeof role !== "string") return;

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: session.tenantId },
    select: { typeCompte: true },
  });
  const rolesAutorises = ROLES_INVITABLES[tenant.typeCompte];
  if (!rolesAutorises.includes(role as RoleUtilisateur)) return;

  const utilisateur = await prisma.user.findFirst({
    where: { id: userId, tenantId: session.tenantId },
  });
  if (!utilisateur || utilisateur.role === "owner") return;

  await prisma.user.update({ where: { id: userId }, data: { role: role as RoleUtilisateur } });
  await enregistrerAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: "equipe.role_modifie",
    entite: "user",
    entiteId: userId,
    details: { email: utilisateur.email, role },
  });

  revalidatePath("/equipe");
}

export async function toggleActifMembreEquipe(userId: string): Promise<void> {
  const session = await exigerOwner();
  if (userId === session.userId) return;

  const utilisateur = await prisma.user.findFirst({
    where: { id: userId, tenantId: session.tenantId },
  });
  if (!utilisateur || utilisateur.role === "owner") return;

  await prisma.user.update({ where: { id: userId }, data: { actif: !utilisateur.actif } });
  await enregistrerAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: utilisateur.actif ? "equipe.desactive" : "equipe.reactive",
    entite: "user",
    entiteId: userId,
    details: { email: utilisateur.email },
  });

  revalidatePath("/equipe");
}

export async function renvoyerInvitation(userId: string): Promise<void> {
  const session = await exigerOwner();

  const utilisateur = await prisma.user.findFirst({
    where: { id: userId, tenantId: session.tenantId, actif: true },
  });
  if (!utilisateur) return;

  const token = randomBytes(32).toString("hex");
  const tokenHash = hasherToken(token);

  await prisma.$transaction([
    prisma.resetMotDePasse.updateMany({
      where: { userId: utilisateur.id, utilise: false },
      data: { utilise: true },
    }),
    prisma.resetMotDePasse.create({
      data: {
        userId: utilisateur.id,
        token: tokenHash,
        expireA: new Date(Date.now() + DUREE_TOKEN_INVITATION_MS),
      },
    }),
  ]);

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: session.tenantId },
    select: { raisonSociale: true },
  });

  const lien = `${process.env.APP_URL ?? "http://localhost:3000"}/reinitialiser-mot-de-passe/${token}`;
  try {
    await envoyerEmail(
      utilisateur.email,
      `Invitation à rejoindre ${tenant.raisonSociale} sur UniGest`,
      `Définissez votre mot de passe pour activer votre compte (lien valable 7 jours) :\n${lien}\n\n` +
        `Si vous ne vous attendiez pas à cette invitation, ignorez cet email.`
    );
  } catch (err) {
    console.error("[equipe] Échec de l'envoi de l'email d'invitation:", err);
  }

  revalidatePath("/equipe");
  redirect(withToast("/equipe", "Invitation renvoyée."));
}
