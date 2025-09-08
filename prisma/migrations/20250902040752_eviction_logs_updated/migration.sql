/*
  Warnings:

  - You are about to drop the column `landlord_id` on the `eviction_logs` table. All the data in the column will be lost.
  - You are about to drop the column `property_id` on the `eviction_logs` table. All the data in the column will be lost.
  - You are about to drop the column `tenant_id` on the `eviction_logs` table. All the data in the column will be lost.
  - You are about to drop the column `unit_id` on the `eviction_logs` table. All the data in the column will be lost.
  - Added the required column `agreement_id` to the `eviction_logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."eviction_logs" DROP CONSTRAINT "eviction_logs_landlord_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."eviction_logs" DROP CONSTRAINT "eviction_logs_property_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."eviction_logs" DROP CONSTRAINT "eviction_logs_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."eviction_logs" DROP CONSTRAINT "eviction_logs_unit_id_fkey";

-- AlterTable
ALTER TABLE "public"."eviction_logs" DROP COLUMN "landlord_id",
DROP COLUMN "property_id",
DROP COLUMN "tenant_id",
DROP COLUMN "unit_id",
ADD COLUMN     "agreement_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."eviction_logs" ADD CONSTRAINT "eviction_logs_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "public"."rental_agreements"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
