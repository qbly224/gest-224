-- CreateEnum
CREATE TYPE "TypeDon" AS ENUM ('don', 'subvention');

-- CreateTable
CREATE TABLE "dons" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "TypeDon" NOT NULL DEFAULT 'don',
    "donateur" TEXT NOT NULL,
    "montant" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dons_tenant_id_idx" ON "dons"("tenant_id");

-- AddForeignKey
ALTER TABLE "dons" ADD CONSTRAINT "dons_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
