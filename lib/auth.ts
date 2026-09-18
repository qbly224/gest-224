import "server-only";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/session";
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
 * À utiliser dans les server components/layouts protégés (et dans les
 * server actions) : redirige vers /connexion si aucune session valide n'est
 * présente. Revérifie aussi que l'utilisateur et l'entreprise sont toujours
 * actifs, et que le mot de passe n'a pas été changé depuis l'émission du
 * jeton, à chaque appel — un jeton JWT reste valide jusqu'à 7 jours et ne
 * doit pas continuer à donner accès après désactivation d'un compte/d'une
 * entreprise ou après une réinitialisation de mot de passe.
 *
 * Ne supprime volontairement pas le cookie ici : cette fonction est aussi
 * appelée depuis des Server Components au rendu d'une page, où Next.js
 * interdit toute écriture de cookie (seules les Server Actions et les
 * Route Handlers le peuvent). Le cookie devenu invalide reste donc présent
 * mais inerte — chaque page continuera à rediriger vers /connexion tant
 * qu'il n'aura pas été remplacé par une nouvelle connexion réussie.
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/connexion");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      actif: true,
      passwordChangedAt: true,
      tenant: { select: { actif: true } },
    },
  });

  const jetonAnterieurAuChangementMdp =
    user?.passwordChangedAt &&
    Math.floor(user.passwordChangedAt.getTime() / 1000) > session.emisA;

  if (!user || !user.actif || !user.tenant.actif || jetonAnterieurAuChangementMdp) {
    redirect("/connexion");
  }

  return session;
}
