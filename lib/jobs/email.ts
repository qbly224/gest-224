import "server-only";
import { prisma } from "@/lib/prisma";
import { envoyerEmail } from "@/lib/email";

const TENTATIVES_MAX = 5;
const LOT_MAX = 50;
// Nombre d'envois Resend en parallèle - borne la charge sortante par
// passage de cron, indépendamment du nombre d'emails en attente.
const CONCURRENCE = 5;

export async function enqueuerEmails(
  tenantId: string,
  emails: { destinataire: string; sujet: string; corps: string }[]
): Promise<void> {
  if (emails.length === 0) return;
  await prisma.jobEmail.createMany({
    data: emails.map((e) => ({ tenantId, ...e })),
  });
}

/**
 * Traite un lot de la file d'attente email (cf. app/api/cron/traiter-file-emails/route.ts).
 * Jamais appelée depuis une action utilisateur : les diffusions en masse
 * (annonces, comptes-rendus) se contentent d'insérer dans JobEmail via
 * enqueuerEmails, pour ne jamais bloquer la requête de l'utilisateur sur
 * l'envoi réel.
 */
export async function traiterFileEmails(): Promise<{
  traites: number;
  envoyes: number;
  echoues: number;
}> {
  const lot = await prisma.jobEmail.findMany({
    where: { statut: "en_attente", tentatives: { lt: TENTATIVES_MAX } },
    orderBy: { createdAt: "asc" },
    take: LOT_MAX,
  });

  let envoyes = 0;
  let echoues = 0;

  for (let i = 0; i < lot.length; i += CONCURRENCE) {
    const tranche = lot.slice(i, i + CONCURRENCE);
    await Promise.all(
      tranche.map(async (job) => {
        try {
          await envoyerEmail(job.destinataire, job.sujet, job.corps);
          await prisma.jobEmail.update({
            where: { id: job.id },
            data: { statut: "envoye", traiteA: new Date() },
          });
          envoyes += 1;
        } catch (err) {
          const tentatives = job.tentatives + 1;
          await prisma.jobEmail.update({
            where: { id: job.id },
            data: {
              tentatives,
              erreur: err instanceof Error ? err.message : String(err),
              statut: tentatives >= TENTATIVES_MAX ? "echec" : "en_attente",
            },
          });
          echoues += 1;
        }
      })
    );
  }

  return { traites: lot.length, envoyes, echoues };
}
