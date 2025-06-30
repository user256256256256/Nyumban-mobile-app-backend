-- CreateTable
CREATE TABLE "user_notification_preferences" (
    "user_id" UUID NOT NULL,
    "notify_nyumban_updates" BOOLEAN NOT NULL DEFAULT true,
    "notify_payment_sms" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_notification_preferences_pkey" PRIMARY KEY ("user_id")
);

-- AddForeignKey
ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
