import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { RoleUtilisateur } from "@prisma/client";

export const SESSION_COOKIE_NAME = "gest224_session";
// Déconnexion automatique après 1h sans activité. Tient par glissement :
// refreshSessionToken() (appelée depuis middleware.ts à chaque requête sur
// une page de l'app) ré-émet un jeton avec une nouvelle expiration à chaque
// passage, donc une session active ne se termine jamais ; seule une
// inactivité réelle d'1h laisse le jeton expirer naturellement.
export const SESSION_DURATION_SECONDS = 60 * 60; // 1 heure

const COOKIE_2FA_PENDING = "gest224_2fa_pending";
const DUREE_2FA_PENDING_SECONDES = 5 * 60; // 5 minutes

const SECRET_DEV_PAR_DEFAUT =
  "dev-secret-change-me-in-production-please-use-a-long-random-string";

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET n'est pas défini.");
  }
  if (process.env.NODE_ENV === "production") {
    if (secret === SECRET_DEV_PAR_DEFAUT) {
      throw new Error(
        "SESSION_SECRET utilise encore la valeur de développement par défaut. " +
          "Générez-en une nouvelle avec `openssl rand -base64 32` avant de démarrer en production."
      );
    }
    if (secret.length < 32) {
      throw new Error(
        "SESSION_SECRET est trop court pour la production (32 caractères minimum). " +
          "Générez-en un avec `openssl rand -base64 32`."
      );
    }
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  userId: string;
  tenantId: string;
  role: RoleUtilisateur;
  // Date d'émission du jeton (epoch secondes) - permet à requireSession()
  // d'invalider les jetons émis avant un changement de mot de passe.
  emisA: number;
};

async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

function parseSessionPayload(payload: Record<string, unknown>): SessionPayload | null {
  const { userId, tenantId, role, emisA } = payload;
  if (
    typeof userId !== "string" ||
    typeof tenantId !== "string" ||
    typeof role !== "string" ||
    typeof emisA !== "number"
  ) {
    return null;
  }
  return { userId, tenantId, role: role as RoleUtilisateur, emisA };
}

export async function createSession(
  payload: Omit<SessionPayload, "emisA">
) {
  const emisA = Math.floor(Date.now() / 1000);
  const token = await signSessionToken({ ...payload, emisA });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return parseSessionPayload(payload as Record<string, unknown>);
  } catch {
    return null;
  }
}

/**
 * Ré-émet le jeton de session avec une expiration repoussée, en conservant
 * emisA inchangé (sans quoi le contrôle anti-rejeu de requireSession() après
 * un changement de mot de passe serait silencieusement contourné à chaque
 * rafraîchissement). Appelée depuis middleware.ts, qui n'a pas accès à
 * next/headers : ne dépend que du jeton brut passé en argument.
 */
export async function refreshSessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const session = parseSessionPayload(payload as Record<string, unknown>);
    if (!session) return null;
    return signSessionToken(session);
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Jeton intermédiaire, de très courte durée, posé une fois le mot de passe
 * vérifié pour un compte avec la double authentification activée : il ne
 * donne accès à rien tant que le code TOTP (ou un code de secours) n'a pas
 * été validé à son tour. Cookie distinct de la session complète pour qu'il
 * ne puisse jamais être confondu avec elle par le reste de l'application.
 */
export async function createPending2faSession(userId: string) {
  const token = await new SignJWT({ userId, type: "2fa_pending" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DUREE_2FA_PENDING_SECONDES}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_2FA_PENDING, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DUREE_2FA_PENDING_SECONDES,
  });
}

export async function getPending2faSession(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_2FA_PENDING)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.type !== "2fa_pending" || typeof payload.userId !== "string") {
      return null;
    }
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export async function destroyPending2faSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_2FA_PENDING);
}
