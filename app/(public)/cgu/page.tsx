import { LegalPage, Section } from "@/components/public/legal-page";

export default function CguPage() {
  return (
    <LegalPage titre="Conditions générales d'utilisation" misAJour="23 septembre 2026">
      <p>
        Les présentes conditions générales d&apos;utilisation (« CGU ») régissent
        l&apos;accès et l&apos;utilisation de la plateforme Gest-224 (le
        « Service »), accessible notamment à l&apos;adresse
        gest-224.onrender.com. En créant un compte, vous acceptez sans réserve
        les présentes CGU.
      </p>

      <Section titre="1. Objet du Service">
        <p>
          Gest-224 est un logiciel de gestion commerciale en ligne (SaaS)
          permettant à une entreprise (l&apos;« Utilisateur ») de créer et
          gérer des devis, bons de commande, bons de livraison, factures,
          factures d&apos;acompte et avoirs, ainsi qu&apos;un suivi
          comptable simplifié (recettes et dépenses).
        </p>
      </Section>

      <Section titre="2. Création de compte">
        <p>
          L&apos;accès au Service nécessite la création d&apos;un compte,
          associé à une entreprise (identifiée notamment par son SIRET) et à
          un utilisateur titulaire. Les informations fournies lors de
          l&apos;inscription doivent être exactes et tenues à jour.
          L&apos;Utilisateur est responsable de la confidentialité de ses
          identifiants et de toute activité effectuée depuis son compte.
        </p>
      </Section>

      <Section titre="3. Utilisation conforme">
        <p>
          L&apos;Utilisateur s&apos;engage à utiliser le Service conformément
          à sa destination et à la réglementation applicable, notamment en
          matière de facturation commerciale. Il s&apos;interdit
          notamment : toute utilisation frauduleuse (fausses factures,
          usurpation d&apos;identité), toute tentative d&apos;accès non
          autorisé aux données d&apos;une autre entreprise, et toute
          exploitation du Service à des fins illicites.
        </p>
      </Section>

      <Section titre="4. Responsabilité de l'Utilisateur sur les documents émis">
        <p>
          Gest-224 fournit les outils de génération de documents conformes
          aux règles françaises de facturation (numérotation, mentions
          légales), mais l&apos;exactitude des informations saisies
          (identité, montants, taux de TVA, régime fiscal) relève de la seule
          responsabilité de l&apos;Utilisateur. Gest-224 ne se substitue pas
          à un conseil comptable, fiscal ou juridique.
        </p>
      </Section>

      <Section titre="5. Disponibilité et évolution du Service">
        <p>
          Gest-224 met en œuvre les moyens raisonnables pour assurer la
          disponibilité du Service, sans garantie d&apos;absence
          d&apos;interruption. Des opérations de maintenance peuvent
          entraîner des indisponibilités temporaires. Le Service peut
          évoluer (nouvelles fonctionnalités, modification de
          fonctionnalités existantes) ; les évolutions substantielles sont
          annoncées dans la mesure du possible.
        </p>
      </Section>

      <Section titre="6. Suspension et résiliation">
        <p>
          Gest-224 peut suspendre l&apos;accès à un compte en cas de
          manquement aux présentes CGU, de défaut de paiement pour un plan
          payant, ou d&apos;activité suspecte. L&apos;Utilisateur peut à
          tout moment supprimer définitivement son compte et l&apos;ensemble
          de ses données depuis la page « Entreprise » de son espace.
        </p>
      </Section>

      <Section titre="7. Limitation de responsabilité">
        <p>
          Dans les limites permises par la loi, la responsabilité de
          Gest-224 ne saurait être engagée pour tout dommage indirect
          résultant de l&apos;utilisation du Service, ni pour les
          conséquences d&apos;une erreur de saisie de l&apos;Utilisateur.
        </p>
      </Section>

      <Section titre="8. Modification des CGU">
        <p>
          Les présentes CGU peuvent être modifiées à tout moment. La version
          applicable est celle en vigueur au moment de l&apos;utilisation du
          Service.
        </p>
      </Section>

      <Section titre="9. Droit applicable">
        <p>
          Les présentes CGU sont soumises au droit français. Tout litige
          relatif à leur interprétation ou leur exécution relève de la
          compétence des tribunaux français.
        </p>
      </Section>
    </LegalPage>
  );
}
