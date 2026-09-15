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
- **Authentification** : email / mot de passe, un compte = une entreprise
  (tenant)

## État du projet

Phase en cours : **Phase 1 — Socle multi-tenant** (schéma de données en
cours de validation, voir `docs/schema-phase-1-2.md`).

| Phase | Contenu | Statut |
|---|---|---|
| 1 | Socle multi-tenant, clients, catalogue | Schéma proposé |
| 2 | Devis & Facture (PDF, numérotation, conversion) | À venir |
| 3 | Bon de commande, bon de livraison, acompte, avoir | À venir |
| 4 | Comptabilité simplifiée | À venir |
| 5 | Mise en marché SaaS (plans, onboarding) | À venir |

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
