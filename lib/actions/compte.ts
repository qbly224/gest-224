"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/auth";
import { destroySession } from "@/lib/session";
import type { ActionState } from "@/lib/actions/types";

/**
 * Suppression du compte par son propriétaire : supprime le tenant entier
 * (toutes ses données cascadent via les contraintes onDelete: Cascade du
 * schéma — clients, articles, documents, comptabilité, etc.), pas
 * seulement l'utilisateur. Tous les comptes créés à ce jour sont "owner"
 * de leur propre tenant (pas de flux d'invitation de collaborateur), donc
 * les deux se confondent en pratique.
 */
export async function supprimerCompte(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const motDePasse = formData.get("motDePasse");

  if (typeof motDePasse !== "string" || motDePasse.length === 0) {
    return { error: "Mot de passe requis pour confirmer la suppression." };
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });
  const motDePasseValide = await verifyPassword(motDePasse, user.passwordHash);
  if (!motDePasseValide) {
    return { error: "Mot de passe incorrect." };
  }

  await prisma.tenant.delete({ where: { id: session.tenantId } });
  await destroySession();
  redirect("/connexion?compteSupprime=1");
}
