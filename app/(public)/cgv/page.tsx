import { LegalPage, Section } from "@/components/public/legal-page";

export default function CgvPage() {
  return (
    <LegalPage titre="Conditions générales de vente" misAJour="23 septembre 2026">
      <p>
        Les présentes conditions générales de vente (« CGV ») s&apos;appliquent
        à la souscription d&apos;un abonnement payant à la plateforme
        Gest-224, en complément des{" "}
        <a href="/cgu" className="underline">
          conditions générales d&apos;utilisation
        </a>
        .
      </p>

      <Section titre="1. Nature professionnelle du contrat">
        <p>
          L&apos;inscription à Gest-224 requiert l&apos;identification
          d&apos;une entreprise (raison sociale, SIRET). L&apos;abonnement est
          donc souscrit par un professionnel agissant dans le cadre de son
          activité commerciale, et non par un consommateur au sens du Code de
          la consommation. Le droit de rétractation de 14 jours prévu aux
          articles L221-18 et suivants du Code de la consommation, réservé
          aux contrats conclus avec des consommateurs, ne s&apos;applique
          donc pas.
        </p>
      </Section>

      <Section titre="2. Plans et tarifs">
        <p>
          Les plans disponibles (Gratuit, Starter, Pro) et leurs tarifs sont
          présentés sur la page{" "}
          <a href="/tarifs" className="underline">
            Tarifs
          </a>
          . Les tarifs sont exprimés en euros. Gest-224 se réserve le droit
          de modifier ses tarifs ; toute modification est annoncée avant sa
          prise d&apos;effet et ne s&apos;applique pas rétroactivement à un
          abonnement déjà facturé.
        </p>
      </Section>

      <Section titre="3. Modalités de paiement">
        <p>
          Deux modalités de règlement sont proposées :
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Paiement par carte bancaire</strong>, via notre
            prestataire de paiement Stripe. L&apos;abonnement est activé
            immédiatement à la confirmation du paiement, et reconduit
            automatiquement chaque mois jusqu&apos;à résiliation.
          </li>
          <li>
            <strong>Paiement en espèces ou par virement</strong>, hors
            plateforme. Le plan choisi est appliqué immédiatement à titre
            provisoire, mais la création de nouveaux documents reste
            bloquée jusqu&apos;à validation manuelle du paiement par un
            administrateur de la plateforme.
          </li>
        </ul>
      </Section>

      <Section titre="4. Durée et résiliation">
        <p>
          L&apos;abonnement est mensuel, sans engagement de durée.
          L&apos;Utilisateur peut résilier à tout moment depuis la page
          Abonnement de son espace ; la résiliation d&apos;un abonnement payé
          par carte met fin à la reconduction automatique et repasse le
          compte au plan gratuit. Sauf disposition contraire, les sommes déjà
          versées pour la période en cours ne sont pas remboursées au
          prorata.
        </p>
      </Section>

      <Section titre="5. Défaut de paiement">
        <p>
          En cas d&apos;échec de paiement par carte ou de non-validation
          d&apos;un paiement en espèces, l&apos;accès aux fonctionnalités de
          création de nouveaux documents peut être suspendu ; les données
          existantes restent consultables. L&apos;accès complet est rétabli
          dès régularisation du paiement.
        </p>
      </Section>

      <Section titre="6. Facturation">
        <p>
          Les factures relatives à un abonnement payé par carte sont
          accessibles depuis le portail de facturation Stripe, disponible
          depuis la page Abonnement de l&apos;espace utilisateur.
        </p>
      </Section>
    </LegalPage>
  );
}
