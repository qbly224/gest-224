-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password_changed_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "resets_mot_de_passe" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expire_a" TIMESTAMP(3) NOT NULL,
    "utilise" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resets_mot_de_passe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resets_mot_de_passe_token_key" ON "resets_mot_de_passe"("token");

-- CreateIndex
CREATE INDEX "resets_mot_de_passe_user_id_idx" ON "resets_mot_de_passe"("user_id");

-- AddForeignKey
ALTER TABLE "resets_mot_de_passe" ADD CONSTRAINT "resets_mot_de_passe_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
