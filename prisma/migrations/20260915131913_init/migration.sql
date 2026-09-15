-- CreateEnum
CREATE TYPE "RegimeTva" AS ENUM ('normal', 'franchise');

-- CreateEnum
CREATE TYPE "RoleUtilisateur" AS ENUM ('owner', 'membre');

-- CreateEnum
CREATE TYPE "TypeClient" AS ENUM ('particulier', 'professionnel');

-- CreateEnum
CREATE TYPE "TypeArticle" AS ENUM ('produit', 'service');

-- CreateEnum
CREATE TYPE "TypeDocument" AS ENUM ('devis', 'bon_commande', 'bon_livraison', 'facture', 'facture_acompte', 'facture_avoir');

-- CreateEnum
CREATE TYPE "StatutDocument" AS ENUM ('brouillon', 'envoye', 'accepte', 'refuse', 'converti', 'livre', 'payee_partiellement', 'payee', 'en_retard', 'annule');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "raison_sociale" TEXT NOT NULL,
    "forme_juridique" TEXT,
    "siret" VARCHAR(14) NOT NULL,
    "siren" VARCHAR(9),
    "numero_tva_intracom" TEXT,
    "regime_tva" "RegimeTva" NOT NULL DEFAULT 'franchise',
    "capital_social" DECIMAL(12,2),
    "adresse_ligne1" TEXT NOT NULL,
    "adresse_ligne2" TEXT,
    "code_postal" VARCHAR(10) NOT NULL,
    "ville" TEXT NOT NULL,
    "pays" TEXT NOT NULL DEFAULT 'France',
    "email" TEXT,
    "telephone" TEXT,
    "iban" TEXT,
    "bic" TEXT,
    "mentions_legales_libres" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "role" "RoleUtilisateur" NOT NULL DEFAULT 'owner',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "TypeClient" NOT NULL DEFAULT 'professionnel',
    "raison_sociale" TEXT,
    "siret" TEXT,
    "numero_tva_intracom" TEXT,
    "civilite" TEXT,
    "nom" TEXT,
    "prenom" TEXT,
    "adresse_ligne1" TEXT NOT NULL,
    "adresse_ligne2" TEXT,
    "code_postal" VARCHAR(10) NOT NULL,
    "ville" TEXT NOT NULL,
    "pays" TEXT NOT NULL DEFAULT 'France',
    "email" TEXT,
    "telephone" TEXT,
    "notes" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "TypeArticle" NOT NULL DEFAULT 'service',
    "reference" TEXT,
    "designation" TEXT NOT NULL,
    "description" TEXT,
    "unite_mesure" TEXT DEFAULT 'unité',
    "prix_unitaire_ht" DECIMAL(10,2) NOT NULL,
    "taux_tva" DECIMAL(4,2),
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "numbering_sequences" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type_document" "TypeDocument" NOT NULL,
    "annee" INTEGER NOT NULL,
    "prefixe" VARCHAR(10) NOT NULL,
    "dernier_numero" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "numbering_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "TypeDocument" NOT NULL,
    "numero" TEXT NOT NULL,
    "statut" "StatutDocument" NOT NULL DEFAULT 'brouillon',
    "client_id" TEXT NOT NULL,
    "ref_document_id" TEXT,
    "date_emission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_echeance" TIMESTAMP(3),
    "conditions_paiement" TEXT,
    "taux_penalite_retard" DECIMAL(5,2),
    "indemnite_forfaitaire" DECIMAL(6,2) NOT NULL DEFAULT 40,
    "notes" TEXT,
    "montant_ht" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "montant_tva" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "montant_ttc" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "emetteur_snapshot" JSONB NOT NULL,
    "client_snapshot" JSONB NOT NULL,
    "created_by_id" TEXT,
    "envoye_at" TIMESTAMP(3),
    "paye_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_lignes" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "article_id" TEXT,
    "ordre" INTEGER NOT NULL,
    "designation" TEXT NOT NULL,
    "description" TEXT,
    "unite_mesure" TEXT,
    "quantite" DECIMAL(10,2) NOT NULL,
    "prix_unitaire_ht" DECIMAL(10,2) NOT NULL,
    "taux_tva" DECIMAL(4,2),
    "remise_pourcentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "montant_ht" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "document_lignes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_siret_key" ON "tenants"("siret");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE INDEX "clients_tenant_id_idx" ON "clients"("tenant_id");

-- CreateIndex
CREATE INDEX "articles_tenant_id_idx" ON "articles"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "numbering_sequences_tenant_id_type_document_annee_key" ON "numbering_sequences"("tenant_id", "type_document", "annee");

-- CreateIndex
CREATE INDEX "documents_tenant_id_idx" ON "documents"("tenant_id");

-- CreateIndex
CREATE INDEX "documents_client_id_idx" ON "documents"("client_id");

-- CreateIndex
CREATE INDEX "documents_ref_document_id_idx" ON "documents"("ref_document_id");

-- CreateIndex
CREATE UNIQUE INDEX "documents_tenant_id_type_numero_key" ON "documents"("tenant_id", "type", "numero");

-- CreateIndex
CREATE INDEX "document_lignes_document_id_idx" ON "document_lignes"("document_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "numbering_sequences" ADD CONSTRAINT "numbering_sequences_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_ref_document_id_fkey" FOREIGN KEY ("ref_document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_lignes" ADD CONSTRAINT "document_lignes_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_lignes" ADD CONSTRAINT "document_lignes_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
