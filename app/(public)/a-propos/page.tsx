export default function AProposPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-encre/60">À propos</p>
      <h1 className="mt-2 font-titre text-3xl text-encre">Pourquoi Gest-224</h1>

      <div className="mt-8 space-y-6 font-sans text-sm leading-relaxed text-encre/80">
        <p>
          Gest-224 est né d&apos;un constat simple : la gestion commerciale
          d&apos;une petite entreprise française — devis, factures, bons de
          commande et de livraison, comptabilité de base — repose encore
          souvent sur des tableurs bricolés ou des outils pensés pour de
          grandes structures, trop lourds pour un auto-entrepreneur ou une
          TPE.
        </p>
        <p>
          Nous construisons une plateforme qui prend en charge la chaîne
          documentaire complète — du devis à la facture, en passant par le
          bon de commande, le bon de livraison, la facture d&apos;acompte et
          l&apos;avoir — dans le respect des règles françaises et
          européennes de facturation : numérotation séquentielle sans trou,
          mentions légales obligatoires, gestion de la franchise en base de
          TVA (art. 293 B du CGI), pénalités de retard.
        </p>
        <p>
          À cela s&apos;ajoute une comptabilité simplifiée : les recettes se
          génèrent automatiquement lorsqu&apos;une facture est marquée
          payée, les dépenses se saisissent en quelques clics, et un tableau
          de bord donne une vue claire du solde et de l&apos;activité
          mensuelle — sans transformer l&apos;utilisateur en comptable.
        </p>
        <p>
          Gest-224 est encore un jeune produit, développé et amélioré en
          continu. La facturation électronique structurée (Factur-X, PDP)
          fait partie de notre feuille de route, en anticipation des
          échéances réglementaires françaises à venir.
        </p>
      </div>
    </main>
  );
}
