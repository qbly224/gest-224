-- Archive documentaire de l'association (cf. lib/actions/documents-associatifs.ts)
CREATE TYPE "CategorieDocumentAssociatif" AS ENUM ('statuts', 'reglement_interieur', 'proces_verbal', 'rapport_activite', 'administratif', 'autre');

CREATE TABLE "documents_associatifs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "categorie" "CategorieDocumentAssociatif" NOT NULL DEFAULT 'autre',
    "titre" TEXT NOT NULL,
    "nom_fichier" TEXT NOT NULL,
    "type_mime" TEXT NOT NULL,
    "taille_octets" INTEGER NOT NULL,
    "contenu" BYTEA NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_associatifs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "documents_associatifs_tenant_id_idx" ON "documents_associatifs"("tenant_id");

ALTER TABLE "documents_associatifs" ADD CONSTRAINT "documents_associatifs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
