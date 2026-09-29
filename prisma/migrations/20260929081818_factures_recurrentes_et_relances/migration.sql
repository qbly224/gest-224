-- CreateEnum
CREATE TYPE "FrequenceRecurrence" AS ENUM ('mensuelle', 'trimestrielle', 'annuelle');

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "dernier_rappel_envoye_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "relances_activees" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "factures_recurrentes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "description" TEXT,
    "quantite" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "prix_unitaire_ht" DECIMAL(10,2) NOT NULL,
    "taux_tva" DECIMAL(4,2),
    "conditions_paiement" TEXT,
    "frequence" "FrequenceRecurrence" NOT NULL,
    "prochaine_generation_date" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "dernier_document_genere_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "factures_recurrentes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "factures_recurrentes_tenant_id_idx" ON "factures_recurrentes"("tenant_id");

-- AddForeignKey
ALTER TABLE "factures_recurrentes" ADD CONSTRAINT "factures_recurrentes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factures_recurrentes" ADD CONSTRAINT "factures_recurrentes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
