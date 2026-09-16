-- CreateEnum
CREATE TYPE "PlanAbonnement" AS ENUM ('gratuit', 'starter', 'pro');

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "onboarding_masque" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "plan" "PlanAbonnement" NOT NULL DEFAULT 'gratuit';
