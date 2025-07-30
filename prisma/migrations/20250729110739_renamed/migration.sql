/*
  Warnings:

  - You are about to drop the column `user_id` on the `property_applications` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "property_applications" DROP CONSTRAINT "fk_pa_user";

-- AlterTable
ALTER TABLE "property_applications" DROP COLUMN "user_id",
ADD COLUMN     "tenant_id" UUID;

-- AddForeignKey
ALTER TABLE "property_applications" ADD CONSTRAINT "fk_pa_user" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
