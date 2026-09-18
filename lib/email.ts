import "server-only";

/**
 * Envoi d'email minimal, pensé pour être remplacé facilement par un vrai
 * fournisseur. Sans RESEND_API_KEY configurée, le contenu est simplement
 * journalisé — suffisant pour du développement local ou une mise en route
 * manuelle, mais **pas pour une vraie mise en production** : sans email
 * réel, personne ne reçoit son lien de réinitialisation de mot de passe.
 *
 * Resend a été choisi comme fournisseur par défaut pour sa simplicité (un
 * appel HTTP, pas de SMTP à configurer) ; brancher un autre fournisseur ne
 * demande de changer que ce fichier.
 */
export async function envoyerEmail(
  destinataire: string,
  sujet: string,
  corpsTexte: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      `[email] Aucun fournisseur configuré (RESEND_API_KEY absente) — contenu journalisé au lieu d'être envoyé.\n` +
        `À: ${destinataire}\nSujet: ${sujet}\n\n${corpsTexte}`
    );
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const reponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: destinataire,
      subject: sujet,
      text: corpsTexte,
    }),
  });

  if (!reponse.ok) {
    const detail = await reponse.text().catch(() => "");
    throw new Error(`Échec de l'envoi de l'email (${reponse.status}) : ${detail}`);
  }
}
