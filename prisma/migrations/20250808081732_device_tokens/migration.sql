/*
  Warnings:

  - The values [cancelled] on the enum `application_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `createdAt` on the `eviction_logs` table. All the data in the column will be lost.
  - You are about to drop the column `gracePeriodEnd` on the `eviction_logs` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `eviction_logs` table. All the data in the column will be lost.
  - You are about to drop the column `warningSentAt` on the `eviction_logs` table. All the data in the column will be lost.
  - The `type` column on the `rent_payments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[user_id]` on the table `user_notification_preferences` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."application_status_new" AS ENUM ('pending', 'approved', 'rejected');
ALTER TABLE "public"."property_applications" ALTER COLUMN "status" TYPE "public"."application_status_new" USING ("status"::text::"public"."application_status_new");
ALTER TYPE "public"."application_status" RENAME TO "application_status_old";
ALTER TYPE "public"."application_status_new" RENAME TO "application_status";
DROP TYPE "public"."application_status_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."eviction_logs" DROP CONSTRAINT "eviction_logs_landlord_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."eviction_logs" DROP CONSTRAINT "eviction_logs_property_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."eviction_logs" DROP CONSTRAINT "eviction_logs_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."eviction_logs" DROP CONSTRAINT "eviction_logs_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."property_engagements" DROP CONSTRAINT "property_engagements_property_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."property_engagements" DROP CONSTRAINT "property_engagements_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."rent_payments" DROP CONSTRAINT "fk_rp_property";

-- DropForeignKey
ALTER TABLE "public"."rent_payments" DROP CONSTRAINT "fk_rp_unit";

-- DropForeignKey
ALTER TABLE "public"."rental_agreements" DROP CONSTRAINT "fk_ra_template";

-- DropForeignKey
ALTER TABLE "public"."user_notification_preferences" DROP CONSTRAINT "user_notification_preferences_user_id_fkey";

-- DropIndex
DROP INDEX "public"."property_engagements_user_id_property_id_key";

-- AlterTable
ALTER TABLE "public"."eviction_logs" DROP COLUMN "createdAt",
DROP COLUMN "gracePeriodEnd",
DROP COLUMN "updatedAt",
DROP COLUMN "warningSentAt",
ADD COLUMN     "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "grace_period_end" TIMESTAMP(6),
ADD COLUMN     "updated_at" TIMESTAMP(6),
ADD COLUMN     "warning_sent_at" TIMESTAMP(6),
ALTER COLUMN "tenant_id" DROP NOT NULL,
ALTER COLUMN "landlord_id" DROP NOT NULL,
ALTER COLUMN "property_id" DROP NOT NULL,
ALTER COLUMN "reason" DROP NOT NULL,
ALTER COLUMN "status" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."payments" ALTER COLUMN "metadata" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."properties" ADD COLUMN     "search_vector" tsvector,
ALTER COLUMN "energy_efficiency_features" DROP NOT NULL,
ALTER COLUMN "energy_efficiency_features" SET DATA TYPE TEXT,
ALTER COLUMN "amenities" DROP NOT NULL,
ALTER COLUMN "amenities" SET DATA TYPE TEXT,
ALTER COLUMN "open_house_dates" DROP NOT NULL,
ALTER COLUMN "open_house_dates" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."property_engagements" ALTER COLUMN "user_id" DROP NOT NULL,
ALTER COLUMN "property_id" DROP NOT NULL,
ALTER COLUMN "liked" DROP NOT NULL,
ALTER COLUMN "saved" DROP NOT NULL,
ALTER COLUMN "created_at" DROP NOT NULL,
ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."rent_payments" DROP COLUMN "type",
ADD COLUMN     "type" TEXT;

-- AlterTable
ALTER TABLE "public"."user_notification_preferences" ALTER COLUMN "notify_nyumban_updates" DROP NOT NULL,
ALTER COLUMN "notify_payment_sms" DROP NOT NULL;

-- DropEnum
DROP TYPE "public"."payment_type";

-- CreateTable
CREATE TABLE "public"."device_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "device_token" TEXT NOT NULL,
    "endpoint_arn" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_endpoint_arn_key" ON "public"."device_tokens"("endpoint_arn");

-- CreateIndex
CREATE INDEX "device_tokens_user_id_idx" ON "public"."device_tokens"("user_id");

-- CreateIndex
CREATE INDEX "properties_search_vector_idx" ON "public"."properties" USING GIN ("search_vector");

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_preferences_user_id_key" ON "public"."user_notification_preferences"("user_id");

-- AddForeignKey
ALTER TABLE "public"."eviction_logs" ADD CONSTRAINT "eviction_logs_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."eviction_logs" ADD CONSTRAINT "eviction_logs_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."eviction_logs" ADD CONSTRAINT "eviction_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."eviction_logs" ADD CONSTRAINT "eviction_logs_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."property_units"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."property_engagements" ADD CONSTRAINT "property_engagements_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."property_engagements" ADD CONSTRAINT "property_engagements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."rent_payments" ADD CONSTRAINT "fk_rp_property" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."rent_payments" ADD CONSTRAINT "fk_rp_unit" FOREIGN KEY ("unit_id") REFERENCES "public"."property_units"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."device_tokens" ADD CONSTRAINT "device_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "public"."landlord_profiles_landlord_code_key" RENAME TO "landlord_profiles_landlord_code_idx";

-- RenameIndex
ALTER INDEX "public"."landlord_profiles_user_id_key" RENAME TO "landlord_profiles_user_id_idx";

-- RenameIndex
ALTER INDEX "public"."promotion_plans_plan_id_key" RENAME TO "promotion_plans_plan_id_idx";

-- RenameIndex
ALTER INDEX "public"."properties_property_code_key" RENAME TO "properties_property_code_idx";

-- RenameIndex
ALTER INDEX "public"."tenant_profiles_tenant_code_key" RENAME TO "tenant_profiles_tenant_code_idx";

-- RenameIndex
ALTER INDEX "public"."tenant_profiles_user_id_key" RENAME TO "tenant_profiles_user_id_idx";

-- RenameIndex
ALTER INDEX "public"."users_email_key" RENAME TO "users_email_idx";

-- RenameIndex
ALTER INDEX "public"."users_phone_number_key" RENAME TO "users_phone_number_idx";
