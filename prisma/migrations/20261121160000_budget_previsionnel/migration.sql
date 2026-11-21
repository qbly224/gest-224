-- CreateEnum
CREATE TYPE "TypeLigneBudget" AS ENUM ('recette', 'depense');

-- CreateTable
CREATE TABLE "lignes_budget" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "categorie" TEXT NOT NULL,
    "type" "TypeLigneBudget" NOT NULL,
    "montant_prevu" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lignes_budget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lignes_budget_tenant_id_idx" ON "lignes_budget"("tenant_id");

-- AddForeignKey
ALTER TABLE "lignes_budget" ADD CONSTRAINT "lignes_budget_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
