-- Annonces diffusées par email aux membres (cf. lib/actions/annonces.ts)
CREATE TABLE "annonces" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annonces_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "annonces_tenant_id_idx" ON "annonces"("tenant_id");

ALTER TABLE "annonces" ADD CONSTRAINT "annonces_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
