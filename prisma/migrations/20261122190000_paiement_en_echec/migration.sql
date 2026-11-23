-- Délai de grâce après un échec de paiement récurrent (cf. lib/paiement-echec.ts)
ALTER TABLE "tenants" ADD COLUMN "paiement_en_echec_depuis" TIMESTAMP(3);
