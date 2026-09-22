-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "logo_data_url" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "est_admin_plateforme" BOOLEAN NOT NULL DEFAULT false;
