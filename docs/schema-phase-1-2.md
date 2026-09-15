# Schéma de base de données — Phases 1 & 2

Schéma complet dans `prisma/schema.prisma` (PostgreSQL). Ce document explique
les choix de modélisation pour validation avant implémentation.

Toutes les tables métier (hors `numbering_sequences`) portent un `tenant_id`
non nul avec une clé étrangère vers `tenants`, indexé. L'isolation entre
entreprises est appliquée **au niveau des requêtes applicatives** (chaque
requête Prisma est systématiquement filtrée par le `tenant_id` de la session
en cours, centralisé dans une couche d'accès aux données unique) ; on pourra
ajouter des policies PostgreSQL Row-Level-Security en défense en profondeur
dans une phase de durcissement ultérieure, sans changer le schéma.

## 1. `tenants` — l'entreprise

Un tenant = une entreprise inscrite = un espace cloisonné.

- Identité légale : `raison_sociale`, `forme_juridique`, `siret` (unique,
  14 caractères), `siren`, `numero_tva_intracom`, `capital_social`.
- Adresse complète, `email`, `telephone`.
- `regime_tva` (`normal` | `franchise`) — pilote tout le calcul de TVA des
  documents émis par ce tenant.
- Coordonnées bancaires : `iban`, `bic`.
- `mentions_legales_libres` : texte libre pour mentions additionnelles
  (assurance RC pro, agrément, etc.) à imprimer sur les PDF.

## 2. `users` — comptes de connexion

- Rattaché à un seul `tenant_id` (« un compte = une entreprise »).
- `email` unique globalement (identifiant de connexion), `password_hash`.
- `role` (`owner` | `membre`) : un seul rôle utilisé en v1 (`owner`, créé à
  l'inscription), le second est prévu pour une future gestion
  d'utilisateurs multiples par entreprise sans migration de schéma.

## 3. `clients`

- `type` (`particulier` | `professionnel`) détermine quels champs
  d'identité sont pertinents (`raison_sociale`/`siret` vs `civilite`/`nom`/
  `prenom`) — la validation « champ obligatoire selon le type » est faite en
  application, pas en `CHECK` SQL, pour rester simple à faire évoluer.
- Adresse complète, contact, `notes` libres.

## 4. `articles` — catalogue produits/services

- `type` (`produit` | `service`), `designation`, `prix_unitaire_ht`.
- `taux_tva` **nullable** : `NULL` si le tenant est en franchise en base
  (aucune TVA ne s'applique jamais), sinon une valeur parmi 0 / 5,5 / 10 /
  20 — contrôlé en application (un `CHECK` SQL ne peut pas lire
  `regime_tva` d'une autre table sans trigger, jugé disproportionné pour le
  MVP).

## 5. `numbering_sequences` — compteurs par entreprise / type / année

Une ligne par (`tenant_id`, `type_document`, `annee`), avec `prefixe` (ex.
`DEV`, `FA`, `BC`, `BL`, `AC`, `AV`) et `dernier_numero`.

**Pourquoi une table dédiée plutôt qu'une séquence PostgreSQL native** :
une séquence `SERIAL`/`IDENTITY` peut laisser des trous (rollback,
transaction annulée), ce qui est interdit pour une numérotation de facture
française. Le numéro suivant est donc obtenu par un
`SELECT ... FOR UPDATE` sur la ligne du compteur **dans la même
transaction** que l'insertion du document, puis incrémenté — garantissant
zéro trou et zéro doublon même en cas d'accès concurrent.

## 6. `documents` — devis, bons, factures (table unique polymorphe)

Un seul modèle `Document` avec un discriminant `type` (les 6 valeurs de
l'énumération `TypeDocument`) plutôt que 6 tables séparées, parce que :

- la chaîne documentaire (devis → commande → livraison → facture → avoir)
  a besoin d'une seule relation auto-référencée (`ref_document_id`) pour
  tracer n'importe quel enchaînement, ce qui serait beaucoup plus lourd
  avec des tables hétérogènes ;
- la conversion d'un document en un autre (ex. devis accepté → facture)
  devient un simple clone de ligne + nouvel enregistrement pointant vers
  l'original, réutilisable pour toutes les paires (devis→commande,
  commande→livraison, livraison→facture, facture→avoir) ;
- les champs spécifiques à certains types (`date_echeance`,
  `taux_penalite_retard`, `indemnite_forfaitaire`) sont simplement ignorés
  à l'affichage/PDF pour les types où ils ne s'appliquent pas (ex. bon de
  livraison), sans complexifier le schéma.

Champs clés :

- `numero` : numéro complet (ex. `FA-2026-0001`), unique par
  (`tenant_id`, `type`, `numero`) — deux séries différentes peuvent avoir
  le même numéro (`DEV-2026-0001` et `FA-2026-0001` coexistent), jamais
  deux documents du même type/entreprise.
- `statut` : énumération générique ; les transitions valides pour un type
  donné (ex. un `bon_livraison` ne passe jamais par `payee`) sont
  contrôlées en application.
- `client_id` : obligatoire (`onDelete: Restrict` — on ne peut pas
  supprimer un client référencé par un document émis).
- `ref_document_id` : document parent dans la chaîne, nullable.
- `montant_ht` / `montant_tva` / `montant_ttc` : totaux calculés à partir
  des lignes et **persistés** (pas recalculés à la volée), pour que
  l'historique reste figé même si le catalogue ou les taux changent
  ensuite.
- `emetteur_snapshot` / `client_snapshot` (JSON) : copie figée de
  l'identité vendeur et acheteur **au moment de l'émission**
  (raison sociale, SIRET, adresse, IBAN, régime TVA pour l'émetteur...).
  **Point important** : sans cette copie, corriger l'adresse de
  l'entreprise ou d'un client changerait rétroactivement les mentions
  légales de toutes les factures déjà émises, ce qui est interdit — le PDF
  d'une facture doit toujours refléter l'état réel au jour de l'émission.
- `taux_penalite_retard`, `indemnite_forfaitaire` (40 € par défaut, art.
  L441-10 du Code de commerce) : mentions obligatoires sur facture.

**Note de conformité (à appliquer dans la couche applicative, pas dans ce
schéma) :** la loi impose de conserver les factures 10 ans. Aucune mutation
de suppression physique de `documents` ne doit être exposée une fois un
document sorti de l'état `brouillon` ; « annuler » un document = changer son
`statut` à `annule` (ou émettre un avoir), jamais un `DELETE`.

## 7. `document_lignes`

- `article_id` nullable : une ligne peut être libre (texte saisi à la main,
  non issu du catalogue) ou liée à un article (`onDelete: SetNull` — si
  l'article catalogue est supprimé, la ligne historique reste intacte avec
  son texte figé).
- `quantite`, `prix_unitaire_ht`, `taux_tva` (nullable en franchise),
  `remise_pourcentage`.
- `montant_ht` persisté (calculé à l'enregistrement), pour la même raison
  que les totaux du document parent : immuabilité de l'historique.
- Le bon de livraison n'affiche pas les prix : c'est une décision de
  **template PDF** (Phase 3), pas une différence de schéma — les données
  sont stockées de façon uniforme pour tous les types.

## Ce qui n'est volontairement pas dans ce schéma (arrivera en Phase 3/4/5)

- `recettes` / `depenses` (comptabilité simplifiée) — Phase 4.
- Spécificités facture d'acompte / avoir (montant déduit, solde restant) —
  gérées via `ref_document_id` + montant du document lui-même, pas de table
  additionnelle prévue pour l'instant ; à confirmer en Phase 3.
- Plans d'abonnement / facturation SaaS — Phase 5.

## Questions ouvertes pour validation

1. **`siret` unique globalement** sur `tenants` : correct pour une société,
   mais un auto-entrepreneur a aussi un SIRET unique donc ça tient. À
   confirmer si un même SIRET peut légitimement vouloir 2 comptes (ex.
   test/production) — sinon on garde l'unicité stricte.
2. **`role` sur `users`** : gardé à un seul rôle actif (`owner`) en Phase 1
   mais l'énumération prévoit déjà `membre` pour éviter une migration
   plus tard. OK ainsi ?
3. **Facture d'acompte / avoir** : le schéma actuel les traite comme un
   `Document` de plus, avec `ref_document_id` vers la facture d'origine.
   Faut-il un champ dédié `montant_deduit` explicite sur l'avoir, ou le
   montant du document (`montant_ttc`) suffit-il (affiché en négatif au
   PDF) ?
