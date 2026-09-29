import "server-only";
import { prisma } from "@/lib/prisma";
import { calculerMontantLigneHt, calculerTotaux } from "@/lib/documents/calc";
import { getNextNumero } from "@/lib/documents/numbering";
import { buildEmetteurSnapshot, buildClientSnapshot } from "@/lib/documents/snapshot";
import { compterDocumentsMoisCourant } from "@/lib/documents/usage";
import { prochaineDateGeneration } from "@/lib/recurrence/dates";
import { PLANS } from "@/lib/plans";
import { paiementBloque } from "@/lib/paiement-guard";
import { envoyerEmail } from "@/lib/email";

// Délai de paiement par défaut appliqué aux factures générées automatiquement
// (norme B2B française usuelle). Pas encore configurable par modèle — à
// ouvrir si le besoin se confirme.
const DELAI_PAIEMENT_JOURS = 30;

/**
 * Génère une facture en brouillon pour chaque modèle de facturation
 * récurrente arrivé à échéance, puis avance sa prochaine date de
 * génération. Ne facture jamais automatiquement au-delà de la limite du
 * plan ni pour un tenant au paiement bloqué : le modèle est alors
 * simplement laissé en l'état pour être retenté au prochain passage.
 * Jamais d'envoi automatique au client — la facture reste en brouillon
 * pour relecture, un email prévient le tenant qu'elle attend sa validation.
 */
export async function genererFacturesRecurrentesDues(): Promise<{
  examinees: number;
  generees: number;
  ignorees: number;
}> {
  const maintenant = new Date();

  const modeles = await prisma.factureRecurrente.findMany({
    where: { active: true, prochaineGenerationDate: { lte: maintenant } },
    include: { tenant: true, client: true },
  });

  let generees = 0;
  let ignorees = 0;

  for (const modele of modeles) {
    const { tenant, client } = modele;

    if (!tenant.actif || paiementBloque(tenant)) {
      ignorees++;
      continue;
    }

    const limiteDocuments = PLANS[tenant.plan].limiteDocumentsParMois;
    if (limiteDocuments !== null) {
      const nbCeMois = await compterDocumentsMoisCourant(tenant.id);
      if (nbCeMois >= limiteDocuments) {
        ignorees++;
        continue;
      }
    }

    const tauxTva = tenant.regimeTva === "franchise" ? null : modele.tauxTva;
    const ligne = {
      quantite: Number(modele.quantite),
      prixUnitaireHt: Number(modele.prixUnitaireHt),
      tauxTva: tauxTva ? Number(tauxTva) : null,
      remisePourcentage: 0,
    };
    const totaux = calculerTotaux([ligne]);
    const dateEmission = maintenant;
    const dateEcheance = new Date(maintenant.getTime() + DELAI_PAIEMENT_JOURS * 24 * 60 * 60 * 1000);

    const document = await prisma.$transaction(async (tx) => {
      const numero = await getNextNumero(tx, tenant.id, "facture");
      return tx.document.create({
        data: {
          tenantId: tenant.id,
          type: "facture",
          numero,
          statut: "brouillon",
          clientId: client.id,
          dateEmission,
          dateEcheance,
          conditionsPaiement: modele.conditionsPaiement,
          tauxPenaliteRetard: 10,
          montantHt: totaux.montantHt,
          montantTva: totaux.montantTva,
          montantTtc: totaux.montantTtc,
          emetteurSnapshot: buildEmetteurSnapshot(tenant),
          clientSnapshot: buildClientSnapshot(client),
          lignes: {
            create: [
              {
                ordre: 0,
                designation: modele.designation,
                description: modele.description,
                quantite: modele.quantite,
                prixUnitaireHt: modele.prixUnitaireHt,
                tauxTva,
                remisePourcentage: 0,
                montantHt: calculerMontantLigneHt(ligne),
              },
            ],
          },
        },
      });
    });

    await prisma.factureRecurrente.update({
      where: { id: modele.id },
      data: {
        dernierDocumentGenereId: document.id,
        prochaineGenerationDate: prochaineDateGeneration(
          modele.prochaineGenerationDate,
          modele.frequence
        ),
      },
    });

    if (tenant.email) {
      try {
        await envoyerEmail(
          tenant.email,
          `Facture récurrente générée — ${document.numero}`,
          `Bonjour,\n\n` +
            `La facture n° ${document.numero} (« ${modele.designation} », client : ` +
            `${client.raisonSociale ?? `${client.prenom ?? ""} ${client.nom ?? ""}`.trim()}) ` +
            `vient d'être générée automatiquement en brouillon à partir de votre modèle récurrent.\n\n` +
            `Merci de la relire et de l'envoyer depuis votre espace Gest-224 :\n` +
            `${process.env.APP_URL ?? "https://gest-224.onrender.com"}/factures/${document.id}`
        );
      } catch (err) {
        console.error(
          `[factures-recurrentes] Échec de la notification pour ${document.numero}:`,
          err
        );
      }
    }

    generees++;
  }

  return { examinees: modeles.length, generees, ignorees };
}
