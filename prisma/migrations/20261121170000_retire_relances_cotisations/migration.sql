-- AlterTable
ALTER TABLE "membres" DROP COLUMN "relances_activees";
ALTER TABLE "membres" DROP COLUMN "relance_intervalle_jours";

-- AlterTable
ALTER TABLE "cotisations" DROP COLUMN "date_echeance";
ALTER TABLE "cotisations" DROP COLUMN "dernier_rappel_envoye_at";
