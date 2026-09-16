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

Phases 1 à 4 livrées, prêtes à tester. Prochaine étape : Phase 5 (mise en
marché SaaS).

| Phase | Contenu | Statut |
|---|---|---|
| 1 | Socle multi-tenant : auth, fiche entreprise, clients, catalogue | ✅ Livré |
| 2 | Devis & Facture (lignes dynamiques, PDF, numérotation, conversion) | ✅ Livré |
| 3 | Bon de commande, bon de livraison, facture d'acompte, avoir | ✅ Livré |
| 4 | Comptabilité simplifiée (recettes, dépenses, tableau de bord) | ✅ Livré |
| 5 | Mise en marché SaaS (plans, onboarding) | À venir |

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
