-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "moyens_paiement_acceptes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill : préserve le comportement actuel des factures déjà émises pour
-- les entreprises ayant déjà un IBAN renseigné (jusqu'ici affiché sans
-- condition dès qu'il existait).
UPDATE "tenants" SET "moyens_paiement_acceptes" = ARRAY['virement']::TEXT[] WHERE "iban" IS NOT NULL;
