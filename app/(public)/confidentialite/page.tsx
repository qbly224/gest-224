import { LegalPage, Section } from "@/components/public/legal-page";

export default function ConfidentialitePage() {
  return (
    <LegalPage titre="Politique de confidentialité" misAJour="23 septembre 2026">
      <p>
        Cette politique décrit comment Gest-224 collecte, utilise et protège
        les données à caractère personnel traitées dans le cadre du Service,
        conformément au Règlement général sur la protection des données
        (RGPD) et à la loi Informatique et Libertés.
      </p>

      <Section titre="1. Responsable du traitement">
        <p className="rounded-sm bg-encre/5 px-3 py-2 text-encre/70">
          À compléter avant lancement commercial : raison sociale, forme
          juridique, adresse et email de contact de l&apos;éditeur de
          Gest-224, responsable du traitement au sens du RGPD.
        </p>
      </Section>

      <Section titre="2. Données collectées">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Données de compte</strong> : nom, prénom, email, mot de
            passe (haché, jamais stocké en clair).
          </li>
          <li>
            <strong>Données d&apos;entreprise</strong> : raison sociale,
            SIRET, adresse, régime de TVA, coordonnées bancaires (IBAN/BIC)
            si renseignées, logo.
          </li>
          <li>
            <strong>Données saisies par l&apos;Utilisateur</strong> :
            informations sur ses propres clients (nom, adresse, email,
            téléphone, SIRET le cas échéant) et sur les documents commerciaux
            qu&apos;il émet.
          </li>
          <li>
            <strong>Données techniques</strong> : adresse IP (utilisée
            uniquement pour la limitation de tentatives de connexion), et
            journaux techniques nécessaires au fonctionnement et à la
            sécurité du Service.
          </li>
        </ul>
        <p>
          Gest-224 n&apos;installe aucun cookie publicitaire ou de suivi.
          Seul un cookie de session strictement nécessaire à
          l&apos;authentification est utilisé.
        </p>
      </Section>

      <Section titre="3. Finalités et base légale">
        <ul className="list-disc space-y-1 pl-5">
          <li>Fourniture du Service (exécution du contrat) ;</li>
          <li>
            Émission de documents commerciaux conformes à la réglementation
            française (obligation légale) ;
          </li>
          <li>Sécurité du Service et prévention de la fraude (intérêt légitime) ;</li>
          <li>
            Facturation de l&apos;abonnement pour les plans payants
            (exécution du contrat).
          </li>
        </ul>
      </Section>

      <Section titre="4. Durée de conservation">
        <p>
          Les données de compte sont conservées tant que le compte est
          actif. Les documents commerciaux (devis, factures, avoirs) sont
          conservés conformément aux obligations légales de conservation des
          pièces comptables et commerciales en droit français (en principe 10
          ans à compter de la clôture de l&apos;exercice, article L123-22 du
          Code de commerce), même après suppression du compte si la loi
          l&apos;impose.
        </p>
      </Section>

      <Section titre="5. Destinataires et sous-traitants">
        <p>
          Les données sont hébergées et traitées par les prestataires
          suivants, dans le cadre de leur mission :
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Hébergement de l&apos;application : Render (États-Unis) ;</li>
          <li>
            Base de données : Supabase, infrastructure AWS région Europe
            (Paris, eu-west-3) ;
          </li>
          <li>
            Paiement des abonnements : Stripe, lorsque le paiement par carte
            est utilisé ;
          </li>
          <li>
            Envoi d&apos;emails transactionnels (réinitialisation de mot de
            passe) : Resend, lorsque configuré.
          </li>
        </ul>
        <p>
          Aucune donnée n&apos;est vendue à des tiers ni utilisée à des fins
          publicitaires.
        </p>
      </Section>

      <Section titre="6. Vos droits">
        <p>
          Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès,
          de rectification, d&apos;effacement, de limitation, de portabilité
          et d&apos;opposition sur vos données. Le droit de rectification et
          l&apos;accès à vos données s&apos;exercent directement depuis votre
          espace (pages Entreprise, Clients). Le droit à l&apos;effacement
          peut être exercé immédiatement et sans démarche depuis la « zone
          dangereuse » de la page Entreprise, qui supprime définitivement
          votre compte et l&apos;ensemble de vos données (sous réserve des
          obligations légales de conservation mentionnées à la section 4).
          Pour toute autre demande, contactez-nous à l&apos;adresse indiquée
          dans les{" "}
          <a href="/mentions-legales" className="underline">
            mentions légales
          </a>
          .
        </p>
        <p>
          Vous disposez également du droit d&apos;introduire une réclamation
          auprès de la Commission nationale de l&apos;informatique et des
          libertés (CNIL), www.cnil.fr.
        </p>
      </Section>

      <Section titre="7. Sécurité">
        <p>
          Les mots de passe sont hachés (bcrypt), les connexions au Service
          sont chiffrées (HTTPS), et l&apos;accès aux données de chaque
          entreprise est strictement isolé au niveau applicatif. Les
          tentatives de connexion sont limitées pour prévenir les attaques
          par force brute.
        </p>
      </Section>
    </LegalPage>
  );
}
