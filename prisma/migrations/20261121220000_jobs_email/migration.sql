-- File d'attente d'emails à envoi différé (cf. lib/jobs/email.ts)
CREATE TYPE "StatutJobEmail" AS ENUM ('en_attente', 'envoye', 'echec');

CREATE TABLE "jobs_email" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "destinataire" TEXT NOT NULL,
    "sujet" TEXT NOT NULL,
    "corps" TEXT NOT NULL,
    "statut" "StatutJobEmail" NOT NULL DEFAULT 'en_attente',
    "tentatives" INTEGER NOT NULL DEFAULT 0,
    "erreur" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traite_a" TIMESTAMP(3),

    CONSTRAINT "jobs_email_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "jobs_email_statut_created_at_idx" ON "jobs_email"("statut", "created_at");
CREATE INDEX "jobs_email_tenant_id_idx" ON "jobs_email"("tenant_id");

ALTER TABLE "jobs_email" ADD CONSTRAINT "jobs_email_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
