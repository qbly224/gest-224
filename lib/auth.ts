import "server-only";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getSession, destroySession, type SessionPayload } from "@/lib/session";
import { prisma } from "@/lib/prisma";

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
 * /connexion si aucune session valide n'est présente. Revérifie aussi que
 * l'utilisateur et l'entreprise sont toujours actifs à chaque appel — un
 * jeton JWT reste valide jusqu'à 7 jours et ne doit pas continuer à donner
 * accès après désactivation d'un compte ou d'une entreprise.
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/connexion");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { actif: true, tenant: { select: { actif: true } } },
  });
  if (!user || !user.actif || !user.tenant.actif) {
    await destroySession();
    redirect("/connexion");
  }

  return session;
}
