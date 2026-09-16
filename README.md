# Gest-224

SaaS multi-entreprises de gestion commerciale : devis, bons de commande,
bons de livraison, factures, factures d'acompte et factures d'avoir,
conformes aux normes françaises/européennes, avec gestion des clients, du
catalogue produits/services, et une comptabilité simplifiée
(recettes/dépenses).

## Stack

- **Frontend + API** : Next.js 15 (App Router, Route Handlers), React 19,
  TypeScript
- **Base de données** : PostgreSQL, via Prisma ORM
- **Génération PDF** : à définir en Phase 2 (Puppeteer ou équivalent)
- **Authentification** : email / mot de passe (JWT en cookie httpOnly), un
  compte = une entreprise (tenant)

## État du projet

**MVP complet : les 5 phases sont livrées.** Aucun paiement réel n'est
traité (voir Phase 5) ; la facturation électronique structurée
(Factur-X/PDP) n'est volontairement pas implémentée, conformément au
périmètre initial du MVP.

| Phase | Contenu | Statut |
|---|---|---|
| 1 | Socle multi-tenant : auth, fiche entreprise, clients, catalogue | ✅ Livré |
| 2 | Devis & Facture (lignes dynamiques, PDF, numérotation, conversion) | ✅ Livré |
| 3 | Bon de commande, bon de livraison, facture d'acompte, avoir | ✅ Livré |
| 4 | Comptabilité simplifiée (recettes, dépenses, tableau de bord) | ✅ Livré |
| 5 | Mise en marché SaaS (plans, tarifs, onboarding) | ✅ Livré |

### Mise en marché SaaS (Phase 5)

Trois plans (Gratuit / Starter / Pro, `lib/plans.ts`) avec des limites
d'usage (documents/mois, clients) vérifiées côté serveur — **aucun paiement
réel n'est traité**, le changement de plan est immédiat et gratuit depuis
`/abonnement`. Page `/tarifs` publique, choix du plan reporté sur
`/inscription?plan=...`. Un guide de démarrage s'affiche sur le tableau de
bord tant que l'IBAN, un client, un article et un premier devis ne sont pas
créés.

Brancher un vrai paiement (Stripe ou équivalent) est une évolution
ultérieure qui ne devrait toucher que `lib/plans.ts` et le flux de
paiement, pas le reste de l'application.

### Comptabilité simplifiée (Phase 4)

Marquer une facture ou une facture d'acompte "payée" génère automatiquement
sa ligne de recette (montant TTC figé, une seule recette par document). Les
dépenses sont saisies manuellement (date, libellé, montant, catégorie
libre) sous `/depenses`. Le tableau de bord affiche le solde global
(recettes − dépenses) et une vue mensuelle sur 6 mois glissants.

### Chaîne documentaire (Phase 3)

```
devis --accepté--> bon de commande --envoyé--> bon de livraison --livré--> facture --émise--> avoir
  \--accepté---------------------------------------------------------------/  (raccourci direct)
```

Chaque conversion clone les lignes du document source, prend une nouvelle
numérotation et référence le document d'origine (`ref_document_id`). Le bon
de livraison n'affiche ni prix ni TVA. L'avoir se crée depuis une facture
déjà émise et représente le montant à déduire via des quantités négatives
(le prix unitaire reste positif) ; une facture peut recevoir plusieurs
avoirs successifs (avoirs partiels).

## Génération PDF

Les PDF sont générés côté serveur avec Puppeteer, piloté vers un Chromium
déjà présent sur la machine plutôt que celui téléchargé par défaut par
Puppeteer. En local/production, définir `CHROMIUM_EXECUTABLE_PATH` si le
chemin par défaut (`/opt/pw-browsers/chromium`) n'existe pas sur la machine
cible — sinon installer Chromium et pointer vers son exécutable.

Schéma de données complet (phases 1 & 2) : `docs/schema-phase-1-2.md`.

## Démarrer en local

```bash
npm install
cp .env.example .env   # renseigner DATABASE_URL
npm run prisma:migrate
npm run dev
```

## Direction visuelle

Esthétique « registre / document papier » : palette encre verte foncée sur
fond papier ivoire, typographies Lora (titres), Inter (interface), IBM Plex
Mono (chiffres/références). Le prototype de référence
(`gest-qbely-prototype.jsx`) n'est pas encore intégré ; les valeurs
provisoires vivent dans `tailwind.config.ts`.
