-- CreateEnum
CREATE TYPE "StatutChantier" AS ENUM ('a_faire', 'en_cours', 'fait', 'annule');

-- CreateTable
CREATE TABLE "chantiers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "client_id" TEXT,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "adresse" TEXT,
    "montant" DECIMAL(12,2),
    "statut" "StatutChantier" NOT NULL DEFAULT 'a_faire',
    "date_debut" TIMESTAMP(3),
    "date_echeance" TIMESTAMP(3),
    "date_realisation" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chantiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chantiers_tenant_id_idx" ON "chantiers"("tenant_id");

-- AddForeignKey
ALTER TABLE "chantiers" ADD CONSTRAINT "chantiers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chantiers" ADD CONSTRAINT "chantiers_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
