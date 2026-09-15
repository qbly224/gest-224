import "server-only";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/session";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

/**
 * À utiliser dans les server components/layouts protégés : redirige vers
 * /connexion si aucune session valide n'est présente.
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/connexion");
  }
  return session;
}
