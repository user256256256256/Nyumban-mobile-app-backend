-- AlterTable
ALTER TABLE "public"."property_applications" ADD COLUMN     "is_deleted_by_landlord" BOOLEAN DEFAULT false,
ADD COLUMN     "is_deleted_by_tenant" BOOLEAN DEFAULT false;
