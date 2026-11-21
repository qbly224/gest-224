-- Inscriptions et présences aux réunions (cf. lib/actions/reunions.ts)
ALTER TABLE "reunions" ADD COLUMN "compte_rendu_publie_a" TIMESTAMP(3);

CREATE TABLE "participants_reunion" (
    "id" TEXT NOT NULL,
    "reunion_id" TEXT NOT NULL,
    "membre_id" TEXT NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participants_reunion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "participants_reunion_reunion_id_membre_id_key" ON "participants_reunion"("reunion_id", "membre_id");

CREATE INDEX "participants_reunion_membre_id_idx" ON "participants_reunion"("membre_id");

ALTER TABLE "participants_reunion" ADD CONSTRAINT "participants_reunion_reunion_id_fkey" FOREIGN KEY ("reunion_id") REFERENCES "reunions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "participants_reunion" ADD CONSTRAINT "participants_reunion_membre_id_fkey" FOREIGN KEY ("membre_id") REFERENCES "membres"("id") ON DELETE CASCADE ON UPDATE CASCADE;
