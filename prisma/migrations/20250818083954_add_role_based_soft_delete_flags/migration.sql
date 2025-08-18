-- AlterTable
ALTER TABLE "public"."property_tour_requests" ADD COLUMN     "is_deleted_by_landlord" BOOLEAN DEFAULT false,
ADD COLUMN     "is_deleted_by_tenant" BOOLEAN DEFAULT false;
