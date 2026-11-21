-- CreateEnum
CREATE TYPE "TypeCompte" AS ENUM ('entreprise', 'association');

-- CreateEnum
CREATE TYPE "RoleMembre" AS ENUM ('president', 'vice_president', 'tresorier', 'secretaire', 'membre');

-- CreateEnum
CREATE TYPE "StatutMembre" AS ENUM ('actif', 'suspendu', 'radie');

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "type_compte" "TypeCompte" NOT NULL DEFAULT 'entreprise';
ALTER TABLE "tenants" ADD COLUMN "numero_rna" TEXT;
ALTER TABLE "tenants" ALTER COLUMN "siret" DROP NOT NULL;

-- CreateTable
CREATE TABLE "membres" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "civilite" TEXT,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "adresse_ligne1" TEXT,
    "adresse_ligne2" TEXT,
    "code_postal" VARCHAR(10),
    "ville" TEXT,
    "pays" TEXT NOT NULL DEFAULT 'France',
    "date_adhesion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "RoleMembre" NOT NULL DEFAULT 'membre',
    "statut" "StatutMembre" NOT NULL DEFAULT 'actif',
    "notes" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membres_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "membres_tenant_id_idx" ON "membres"("tenant_id");

-- AddForeignKey
ALTER TABLE "membres" ADD CONSTRAINT "membres_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "cotisations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "membre_id" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "date_paiement" TIMESTAMP(3),
    "moyen_paiement" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cotisations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cotisations_tenant_id_idx" ON "cotisations"("tenant_id");

-- CreateIndex
CREATE INDEX "cotisations_membre_id_idx" ON "cotisations"("membre_id");

-- AddForeignKey
ALTER TABLE "cotisations" ADD CONSTRAINT "cotisations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotisations" ADD CONSTRAINT "cotisations_membre_id_fkey" FOREIGN KEY ("membre_id") REFERENCES "membres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "reunions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "lieu" TEXT,
    "description" TEXT,
    "compte_rendu" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reunions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reunions_tenant_id_idx" ON "reunions"("tenant_id");

-- AddForeignKey
ALTER TABLE "reunions" ADD CONSTRAINT "reunions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
