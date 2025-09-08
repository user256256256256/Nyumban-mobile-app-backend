-- AlterTable
ALTER TABLE "public"."rental_agreements" ADD COLUMN     "termination_confirmed_at" TIMESTAMP(6),
ADD COLUMN     "termination_description" VARCHAR(500),
ADD COLUMN     "termination_effective_date" TIMESTAMP(6),
ADD COLUMN     "termination_reason" VARCHAR(100),
ADD COLUMN     "termination_requested_at" TIMESTAMP(6),
ADD COLUMN     "termination_requested_by" UUID,
ADD COLUMN     "termination_role" VARCHAR(50);
