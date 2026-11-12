-- CreateTable
CREATE TABLE "depenses_pieces_jointes" (
    "id" TEXT NOT NULL,
    "depense_id" TEXT NOT NULL,
    "nom_fichier" TEXT NOT NULL,
    "type_mime" TEXT NOT NULL,
    "taille_octets" INTEGER NOT NULL,
    "contenu" BYTEA NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "depenses_pieces_jointes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "depenses_pieces_jointes_depense_id_idx" ON "depenses_pieces_jointes"("depense_id");

-- AddForeignKey
ALTER TABLE "depenses_pieces_jointes" ADD CONSTRAINT "depenses_pieces_jointes_depense_id_fkey" FOREIGN KEY ("depense_id") REFERENCES "depenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
