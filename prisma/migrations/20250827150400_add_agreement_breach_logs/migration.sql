-- CreateEnum
CREATE TYPE "public"."breach_status" AS ENUM ('warning', 'pending_remedy', 'resolved', 'eviction_recommended');

-- CreateTable
CREATE TABLE "public"."agreement_breach_logs" (
    "id" UUID NOT NULL,
    "agreement_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "file_path" TEXT,
    "status" "public"."breach_status" NOT NULL,
    "notice_period" INTEGER,
    "warning_sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remedy_deadline" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "agreement_breach_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agreement_breach_logs_agreement_id_idx" ON "public"."agreement_breach_logs"("agreement_id");

-- AddForeignKey
ALTER TABLE "public"."agreement_breach_logs" ADD CONSTRAINT "agreement_breach_logs_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "public"."rental_agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
