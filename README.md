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

Phases 1 et 2 livrées, prêtes à tester. Prochaine étape : Phase 3 (bon de
commande, bon de livraison, acompte, avoir).

| Phase | Contenu | Statut |
|---|---|---|
| 1 | Socle multi-tenant : auth, fiche entreprise, clients, catalogue | ✅ Livré |
| 2 | Devis & Facture (lignes dynamiques, PDF, numérotation, conversion) | ✅ Livré |
| 3 | Bon de commande, bon de livraison, acompte, avoir | À venir |
| 4 | Comptabilité simplifiée | À venir |
| 5 | Mise en marché SaaS (plans, onboarding) | À venir |

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
