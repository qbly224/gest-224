import { LegalPage, Section } from "@/components/public/legal-page";

export default function MentionsLegalesPage() {
  return (
    <LegalPage titre="Mentions légales" misAJour="23 septembre 2026">
      <p className="rounded-sm bg-red-50 px-3 py-2 text-red-700">
        Cette page n&apos;est pas encore conforme à l&apos;article 6-III de la
        loi n° 2004-575 du 21 juin 2004 (LCEN) : l&apos;identité de
        l&apos;éditeur ci-dessous est un espace réservé à compléter avec les
        informations réelles (raison sociale ou nom, forme juridique, SIRET,
        adresse, contact) avant toute ouverture commerciale du Service.
      </p>

      <Section titre="Éditeur du site">
        <p className="rounded-sm bg-encre/5 px-3 py-2 text-encre/70">
          À compléter : raison sociale (ou nom et prénom si exercice en nom
          propre), forme juridique, adresse du siège, numéro SIRET, adresse
          email de contact, numéro de téléphone.
        </p>
      </Section>

      <Section titre="Directeur de la publication">
        <p className="rounded-sm bg-encre/5 px-3 py-2 text-encre/70">
          À compléter : nom du responsable de la publication.
        </p>
      </Section>

      <Section titre="Hébergement">
        <p>
          L&apos;application est hébergée par <strong>Render Services, Inc.</strong>,
          525 Brannan St, San Francisco, CA 94107, États-Unis
          (render.com).
        </p>
        <p>
          La base de données est hébergée par <strong>Supabase, Inc.</strong>{" "}
          sur une infrastructure AWS, région Europe (Paris, eu-west-3).
        </p>
      </Section>

      <Section titre="Propriété intellectuelle">
        <p>
          L&apos;ensemble des éléments composant le Service (structure,
          textes, logo, charte graphique) est protégé au titre du droit
          d&apos;auteur. Toute reproduction non autorisée est interdite.
        </p>
      </Section>

      <Section titre="Contact">
        <p className="rounded-sm bg-encre/5 px-3 py-2 text-encre/70">
          À compléter : adresse email de contact pour toute question relative
          au Service ou à l&apos;exercice de vos droits.
        </p>
      </Section>
    </LegalPage>
  );
}
