-- CreateEnum
CREATE TYPE "eviction_status" AS ENUM ('warning', 'pending', 'evicted', 'cancelled');

-- AlterEnum
ALTER TYPE "rent_payment_status" ADD VALUE 'partial';

-- CreateTable
CREATE TABLE "eviction_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "landlord_id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "unit_id" UUID,
    "reason" TEXT NOT NULL,
    "status" "eviction_status" NOT NULL DEFAULT 'warning',
    "warningSentAt" TIMESTAMP(3),
    "gracePeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "eviction_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "eviction_logs" ADD CONSTRAINT "eviction_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eviction_logs" ADD CONSTRAINT "eviction_logs_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eviction_logs" ADD CONSTRAINT "eviction_logs_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eviction_logs" ADD CONSTRAINT "eviction_logs_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "property_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
