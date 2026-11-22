-- Compteur de générations de PDF (cf. lib/pdf/limite.ts), pour appliquer
-- la nouvelle limite mensuelle du plan gratuit.
CREATE TABLE "generations_pdf" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generations_pdf_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "generations_pdf_tenant_id_created_at_idx" ON "generations_pdf"("tenant_id", "created_at");

ALTER TABLE "generations_pdf" ADD CONSTRAINT "generations_pdf_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
