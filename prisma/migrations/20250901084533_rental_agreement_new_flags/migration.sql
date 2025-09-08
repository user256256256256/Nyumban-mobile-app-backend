-- AlterTable
ALTER TABLE "public"."rental_agreements" ADD COLUMN     "did_admin_approve_breach" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "landlord_accepted_termination" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tenant_accepted_termination" BOOLEAN NOT NULL DEFAULT false;
