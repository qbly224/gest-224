import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { RoleUtilisateur } from "@prisma/client";

const COOKIE_NAME = "gest224_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 jours

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
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const { userId, tenantId, role } = payload as Record<string, unknown>;
    if (
      typeof userId !== "string" ||
      typeof tenantId !== "string" ||
      typeof role !== "string"
    ) {
      return null;
    }
    return { userId, tenantId, role: role as RoleUtilisateur };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
