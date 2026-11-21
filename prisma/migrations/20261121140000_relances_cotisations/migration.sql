-- AlterTable
ALTER TABLE "membres" ADD COLUMN "relances_activees" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "membres" ADD COLUMN "relance_intervalle_jours" INTEGER NOT NULL DEFAULT 7;

-- AlterTable
ALTER TABLE "cotisations" ADD COLUMN "date_echeance" TIMESTAMP(3);
ALTER TABLE "cotisations" ADD COLUMN "dernier_rappel_envoye_at" TIMESTAMP(3);
