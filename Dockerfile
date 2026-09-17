# syntax=docker/dockerfile:1

# ---- deps : installe toutes les dépendances (incl. dev, nécessaires au build) ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder : génère le client Prisma et construit l'application ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build
# Retire les dépendances de développement (typescript, eslint, tailwind...) :
# le dossier node_modules qui reste est celui embarqué dans l'image finale.
RUN npm prune --omit=dev

# ---- runner : image de production, avec Chromium pour la génération PDF ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium

# `chromium` fournit son propre exécutable + toutes ses dépendances système ;
# fonts-liberation évite un rendu texte dégradé dans les PDF générés.
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium openssl ca-certificates fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./next.config.ts
# Ajoutez cette ligne si le projet gagne un dossier public/ (assets statiques) :
# COPY --from=builder /app/public ./public

USER nextjs
EXPOSE 3000

CMD ["npm", "run", "start"]
