"use server";

import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { requireSession, verifyPassword, hashPassword } from "@/lib/auth";
import { enregistrerAudit } from "@/lib/audit";
import {
  genererSecretTotp,
  verifierCodeTotp,
  construireUriOtpAuth,
  genererCodesSecours,
} from "@/lib/totp";

export type Etat2fa = {
  etape: "inactif" | "qr" | "confirme";
  error?: string;
  qrSvg?: string;
  secret?: string;
  codesSecours?: string[];
};

async function construireEtapeQr(secret: string, email: string, error?: string): Promise<Etat2fa> {
  const uri = construireUriOtpAuth(secret, email);
  const qrSvg = await QRCode.toString(uri, { type: "svg", margin: 1, width: 220 });
  return { etape: "qr", qrSvg, secret, error };
}

/**
 * Un seul useActionState côté client pilote les deux étapes de l'activation
 * (démarrer puis confirmer) : un champ caché "etape" dans le formulaire
 * indique laquelle exécuter. Deux actions séparées auraient chacune leur
 * propre état local côté client, qui ne se mettrait pas à jour en cascade
 * l'une l'autre — une seule action partagée évite ce piège.
 */
export async function gererActivation2fa(
  prevState: Etat2fa,
  formData: FormData
): Promise<Etat2fa> {
  const etapeDemandee = String(formData.get("etape") ?? "");
  if (etapeDemandee === "confirmer") {
    return confirmerActivation2fa(formData);
  }
  return demarrerActivation2fa();
}

async function demarrerActivation2fa(): Promise<Etat2fa> {
  const session = await requireSession();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });
  if (user.totpEnabled) {
    return { etape: "inactif", error: "La double authentification est déjà activée." };
  }

  const secret = genererSecretTotp();
  // Le secret est déjà écrit en base ici, mais reste sans effet tant que
  // totpEnabled n'est pas passé à true par confirmerActivation2fa() ci-dessous
  // (cf. commentaire sur le modèle User dans schema.prisma).
  await prisma.user.update({ where: { id: user.id }, data: { totpSecret: secret } });

  return construireEtapeQr(secret, user.email);
}

async function confirmerActivation2fa(formData: FormData): Promise<Etat2fa> {
  const session = await requireSession();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });
  if (!user.totpSecret) {
    return { etape: "inactif", error: "Démarrez d'abord l'activation." };
  }

  const code = String(formData.get("code") ?? "").trim();
  if (!verifierCodeTotp(user.totpSecret, code)) {
    return construireEtapeQr(user.totpSecret, user.email, "Code invalide. Réessayez.");
  }

  const codesSecours = genererCodesSecours();
  const hashes = await Promise.all(codesSecours.map((c) => hashPassword(c.toUpperCase())));

  await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabled: true, totpBackupCodes: hashes },
  });
  await enregistrerAudit({
    tenantId: user.tenantId,
    userId: user.id,
    action: "securite.2fa_active",
    entite: "user",
    entiteId: user.id,
  });

  return { etape: "confirme", codesSecours };
}

export type EtatSecuriteAction = { error?: string; success?: boolean; codesSecours?: string[] };

export async function desactiver2fa(
  _prevState: EtatSecuriteAction,
  formData: FormData
): Promise<EtatSecuriteAction> {
  const session = await requireSession();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });

  const password = String(formData.get("password") ?? "");
  if (!(await verifyPassword(password, user.passwordHash))) {
    return { error: "Mot de passe incorrect." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabled: false, totpSecret: null, totpBackupCodes: [] },
  });
  await enregistrerAudit({
    tenantId: user.tenantId,
    userId: user.id,
    action: "securite.2fa_desactive",
    entite: "user",
    entiteId: user.id,
  });

  return { success: true };
}

export async function regenererCodesSecours(
  _prevState: EtatSecuriteAction,
  formData: FormData
): Promise<EtatSecuriteAction> {
  const session = await requireSession();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });
  if (!user.totpEnabled) {
    return { error: "La double authentification n'est pas activée." };
  }

  const password = String(formData.get("password") ?? "");
  if (!(await verifyPassword(password, user.passwordHash))) {
    return { error: "Mot de passe incorrect." };
  }

  const codesSecours = genererCodesSecours();
  const hashes = await Promise.all(codesSecours.map((c) => hashPassword(c.toUpperCase())));
  await prisma.user.update({ where: { id: user.id }, data: { totpBackupCodes: hashes } });
  await enregistrerAudit({
    tenantId: user.tenantId,
    userId: user.id,
    action: "securite.codes_secours_regeneres",
    entite: "user",
    entiteId: user.id,
  });

  return { success: true, codesSecours };
}
