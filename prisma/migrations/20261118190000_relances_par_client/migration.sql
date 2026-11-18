-- AlterTable
ALTER TABLE "clients" ADD COLUMN "relances_activees" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "clients" ADD COLUMN "relance_intervalle_jours" INTEGER NOT NULL DEFAULT 7;
