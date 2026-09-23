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

**MVP complet : les 5 phases sont livrées**, plus le paiement réel des
abonnements (Stripe, voir Phase 5) et un panneau d'administration
multi-tenant. La facturation électronique structurée (Factur-X/PDP) n'est
volontairement pas implémentée, conformément au périmètre initial du MVP.

| Phase | Contenu | Statut |
|---|---|---|
| 1 | Socle multi-tenant : auth, fiche entreprise, clients, catalogue | ✅ Livré |
| 2 | Devis & Facture (lignes dynamiques, PDF, numérotation, conversion) | ✅ Livré |
| 3 | Bon de commande, bon de livraison, facture d'acompte, avoir | ✅ Livré |
| 4 | Comptabilité simplifiée (recettes, dépenses, tableau de bord) | ✅ Livré |
| 5 | Mise en marché SaaS (plans, tarifs, onboarding) | ✅ Livré |

### Authentification & sécurité

Réinitialisation de mot de passe en libre-service (`/mot-de-passe-oublie` →
lien à usage unique valable 1h → `/reinitialiser-mot-de-passe/[token]`), qui
invalide automatiquement toutes les sessions ouvertes avant le changement
(le jeton JWT est comparé à `passwordChangedAt` à chaque page protégée).
Sans `RESEND_API_KEY` configurée, le lien est journalisé dans les logs
serveur au lieu d'être envoyé par email — pratique en développement, à
brancher sur un vrai fournisseur avant d'accueillir de vrais clients (voir
`lib/email.ts`).

Aussi en place : limitation de tentatives sur connexion/inscription/demande
de réinitialisation (en mémoire, par processus — donc par instance ; à
remplacer par un store partagé type Redis si l'app est un jour scalée
horizontalement), revérification de `actif` (utilisateur et entreprise) à
chaque page protégée, en-têtes de sécurité HTTP, limites de taille sur tous
les champs de saisie. Pas encore d'email de vérification ni de MFA.

### Mise en marché SaaS (Phase 5)

Trois plans (Gratuit / Starter / Pro, `lib/plans.ts`) avec des limites
d'usage (documents/mois, clients, dépenses/mois) vérifiées côté serveur ;
Starter et Pro donnent en plus accès au rapport complet (`/rapport`). Page
`/tarifs` publique, choix du plan reporté sur `/inscription?plan=...`. Un
guide de démarrage s'affiche sur le tableau de bord tant que l'IBAN, un
client, un article et un premier devis ne sont pas créés.

**Paiement (Stripe).** Un compte est toujours créé en plan gratuit ; choisir
un plan payant (à l'inscription ou depuis `/abonnement`) redirige vers une
session Stripe Checkout hébergée. `Tenant.plan` n'est jamais mis à jour
directement par une action utilisateur pour un plan payant — seul le
webhook `app/api/stripe/webhook/route.ts` (événements
`checkout.session.completed` et `customer.subscription.deleted`) ou
`lib/actions/paiement.ts` (changement d'abonnement existant, résiliation)
l'écrivent, pour que le plan en base reste toujours le reflet de ce que
Stripe facture réellement. Le portail Stripe hébergé (moyen de paiement,
factures, résiliation en libre-service) est accessible depuis
`/abonnement` dès qu'un client Stripe existe.

Variables requises (voir `.env.example`) : `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`. Sans
`STRIPE_SECRET_KEY`, le passage à un plan payant échoue proprement (message
d'erreur) — le plan gratuit et le reste de l'application fonctionnent
normalement.

### Panneau d'administration

`/admin`, réservé aux comptes avec `User.estAdminPlateforme` (jamais vrai
par défaut, promu manuellement en base) : liste de toutes les entreprises
inscrites, tous tenants confondus, avec leurs usages et la possibilité de
changer leur plan ou de les activer/désactiver. Le drapeau est revérifié en
base à chaque requête (jamais porté par le jeton JWT), donc une révocation
est immédiate.

### Documents : logo, téléchargement, envoi

Chaque entreprise peut ajouter un logo (`/entreprise`, PNG/JPEG/WebP/SVG,
500 Ko max, stocké en base en data URL) ; il apparaît sur les PDF et
l'affichage à l'écran, figé dans le snapshot de chaque document comme le
reste de l'identité émetteur. Sur la fiche de chaque document : un vrai
téléchargement PDF (en plus de l'aperçu) et un bouton « Envoyer » qui
ouvre Gmail ou WhatsApp pré-rempli avec les infos du document — ni l'un ni
l'autre ne permettant de joindre un fichier via un simple lien, le message
rappelle de joindre le PDF déjà téléchargé.

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
installé sur la machine plutôt que celui téléchargé par défaut par
Puppeteer. La variable `CHROMIUM_EXECUTABLE_PATH` est **obligatoire** (une
erreur explicite est levée si elle est absente) : `/usr/bin/chromium` dans
l'image Docker (déjà réglé), à définir vous-même en développement local
selon l'endroit où Chromium est installé sur votre machine.

Schéma de données complet (phases 1 & 2) : `docs/schema-phase-1-2.md`.

## Démarrer en local

```bash
npm install
cp .env.example .env   # renseigner DATABASE_URL, SESSION_SECRET, CHROMIUM_EXECUTABLE_PATH
npm run prisma:migrate
npm run dev
```

## Déploiement (Docker)

L'image (`Dockerfile`, multi-stage) embarque Chromium pour la génération
PDF — aucune dépendance externe à installer sur la plateforme cible tant
qu'elle exécute des conteneurs Docker (Railway, Render, Fly.io, VPS...).

**Variables d'environnement requises en production :**

| Variable | Description |
|---|---|
| `DATABASE_URL` | URL de connexion à votre PostgreSQL de production |
| `SESSION_SECRET` | Chaîne aléatoire longue — générer avec `openssl rand -base64 32` |
| `APP_URL` | URL publique de l'app (ex. `https://app.gest224.fr`) — utilisée dans les liens envoyés par email |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Optionnelles mais nécessaires pour que la réinitialisation de mot de passe envoie un vrai email (sinon le lien est seulement journalisé — inutilisable par un vrai client) |

`CHROMIUM_EXECUTABLE_PATH` et `PORT` sont déjà définis dans l'image, pas
besoin de les régler sur la plateforme.

**Étapes :**

```bash
# 1. Construire l'image
docker build -t gest-224 .

# 2. Appliquer les migrations sur la base de production (une seule fois,
#    puis à chaque nouvelle migration — jamais en parallèle sur plusieurs
#    instances)
docker run --rm -e DATABASE_URL="$DATABASE_URL" gest-224 npx prisma migrate deploy

# 3. Démarrer le conteneur
docker run -d -p 3000:3000 \
  -e DATABASE_URL="$DATABASE_URL" \
  -e SESSION_SECRET="$SESSION_SECRET" \
  --name gest-224 gest-224
```

Sur une plateforme PaaS (Railway, Render...), configurez l'étape 2 comme
« release command »/« pre-deploy command » exécutée avant chaque
démarrage, plutôt que dans le `CMD` du conteneur (évite les migrations
concurrentes si la plateforme démarre plusieurs instances).

Un point de santé est exposé sur `GET /api/health` (vérifie aussi la
connexion à la base) — à utiliser comme healthcheck de la plateforme.

Pour tester l'image en local avant de déployer : `docker compose up --build`
(nécessite `DATABASE_URL` et `SESSION_SECRET` dans l'environnement ou un
fichier `.env` à la racine, lu automatiquement par Docker Compose).

**Non testé dans cet environnement** : le `docker build` et le `docker run`
n'ont pas pu être exécutés ici faute de démon Docker disponible (seul le
client Docker est installé). Le Dockerfile a été relu attentivement et
`npm ci`/`npm run build` valident individuellement en dehors de Docker,
mais la première construction réelle de l'image reste à faire par vous —
signalez toute erreur rencontrée pour que je corrige.

## Direction visuelle

Esthétique « registre / document papier » : palette encre verte foncée sur
fond papier ivoire, typographies Lora (titres), Inter (interface), IBM Plex
Mono (chiffres/références). Le prototype de référence
(`gest-qbely-prototype.jsx`) n'est pas encore intégré ; les valeurs
provisoires vivent dans `tailwind.config.ts`.
