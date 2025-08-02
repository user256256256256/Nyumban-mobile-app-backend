-- CreateEnum
CREATE TYPE "payment_type" AS ENUM ('rent', 'security_deposit');

-- AlterTable
ALTER TABLE "rent_payments" ADD COLUMN     "type" "payment_type" NOT NULL DEFAULT 'rent';
