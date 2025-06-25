-- CreateEnum
CREATE TYPE "agreement_status" AS ENUM ('active', 'completed', 'cancelled', 'terminated', 'draft', 'ready');

-- CreateEnum
CREATE TYPE "application_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "employment_status" AS ENUM ('employed', 'unemployed');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('system', 'user');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('MTN', 'Airtel', 'Cash');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'successful', 'failed');

-- CreateEnum
CREATE TYPE "property_promotion_status" AS ENUM ('not_promoted', 'scheduled', 'active', 'expired');

-- CreateEnum
CREATE TYPE "property_status" AS ENUM ('available', 'occupied', 'archived');

-- CreateEnum
CREATE TYPE "rent_payment_status" AS ENUM ('pending', 'completed', 'overdued');

-- CreateEnum
CREATE TYPE "review_target_type" AS ENUM ('property', 'user', 'system');

-- CreateEnum
CREATE TYPE "review_type" AS ENUM ('property', 'user', 'system');

-- CreateEnum
CREATE TYPE "tenant_status" AS ENUM ('active', 'suspended', 'terminated');

-- CreateEnum
CREATE TYPE "tour_status" AS ENUM ('pending', 'accepted', 'declined');

-- CreateEnum
CREATE TYPE "unit_status" AS ENUM ('available', 'occupied');

-- CreateEnum
CREATE TYPE "verification_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "account_verification_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "payment_id" UUID,
    "verified_by" UUID,
    "status" "verification_status",
    "verification_date" DATE,
    "comment" TEXT,
    "proof_of_ownership_file_path" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "account_verification_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landlord_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "landlord_code" TEXT,
    "full_names" TEXT,

    CONSTRAINT "landlord_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "type" "notification_type",
    "title" TEXT,
    "body" TEXT,
    "is_read" BOOLEAN DEFAULT false,
    "sent_at" TIMESTAMP(6),
    "read_at" TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "payment_date" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "status" "payment_status",
    "method" "payment_method",
    "amount" DECIMAL,
    "payment_type" TEXT,
    "reference_id" UUID,
    "transaction_id" TEXT,
    "currency" TEXT,
    "metadata" JSON,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_plans" (
    "id" UUID NOT NULL,
    "plan_id" TEXT NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "price" DECIMAL NOT NULL,
    "currency" TEXT DEFAULT 'UGX',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "promotion_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" UUID NOT NULL,
    "owner_id" UUID,
    "property_name" TEXT NOT NULL,
    "property_type" TEXT,
    "property_code" TEXT,
    "property_website" TEXT,
    "likes" INTEGER,
    "saves" INTEGER,
    "ownership_file_path" TEXT,
    "has_units" BOOLEAN DEFAULT false,
    "is_promoted" BOOLEAN DEFAULT false,
    "is_verified" BOOLEAN DEFAULT false,
    "has_agreement" BOOLEAN DEFAULT false,
    "country" TEXT,
    "address" TEXT,
    "price" DECIMAL,
    "currency" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "year_built" INTEGER,
    "parking_spaces" INTEGER,
    "thumbnail_image_path" TEXT,
    "energy_efficiency_features" TEXT,
    "amenities" TEXT,
    "tour_3d_url" TEXT,
    "status" "property_status",
    "open_house_dates" TEXT,
    "description" TEXT,
    "pet_policy" TEXT,
    "smoking_policy" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_applications" (
    "id" UUID NOT NULL,
    "property_id" UUID,
    "unit_id" UUID,
    "user_id" UUID,
    "landlord_id" UUID,
    "status" "application_status",
    "tenant_message" TEXT,
    "landlord_message" TEXT,
    "submitted_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "property_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_images" (
    "id" UUID NOT NULL,
    "property_id" UUID,
    "image_url" TEXT,
    "caption" TEXT,
    "created_at" TIMESTAMP(6),

    CONSTRAINT "property_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_promotions" (
    "id" UUID NOT NULL,
    "payment_id" UUID,
    "user_id" UUID,
    "property_id" UUID,
    "start_date" DATE,
    "end_date" DATE,
    "status" "property_promotion_status",
    "price" DECIMAL,
    "duration" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "property_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_tour_requests" (
    "id" UUID NOT NULL,
    "property_id" UUID,
    "requester_id" UUID,
    "owner_id" UUID,
    "status" "tour_status",
    "message" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "property_tour_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_units" (
    "id" UUID NOT NULL,
    "property_id" UUID,
    "unit_number" TEXT,
    "status" "unit_status",
    "price" DECIMAL,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "property_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rent_payments" (
    "id" UUID NOT NULL,
    "rental_agreement_id" UUID,
    "tenant_id" UUID,
    "unit_id" UUID,
    "property_id" UUID,
    "due_date" DATE,
    "due_amount" DECIMAL,
    "payment_date" TIMESTAMP(6),
    "amount_paid" DECIMAL,
    "status" "rent_payment_status",
    "method" "payment_method",
    "period_covered" TEXT,
    "transaction_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "rent_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_agreement_templates" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "template_html" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "rental_agreement_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_agreements" (
    "id" UUID NOT NULL,
    "template_id" UUID,
    "property_id" UUID,
    "unit_id" UUID,
    "owner_id" UUID,
    "tenant_id" UUID,
    "status" "agreement_status",
    "file_path" TEXT,
    "tenant_accepted_agreement" BOOLEAN DEFAULT false,
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "rental_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "rating" INTEGER,
    "review_type" "review_type",
    "user_id" UUID,
    "target_id" UUID,
    "target_type" "review_target_type",
    "comment" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slide_role_assignments" (
    "id" UUID NOT NULL,
    "slide_id" UUID,
    "role_id" UUID,
    "assigned_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slide_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slides" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "is_active" BOOLEAN DEFAULT true,
    "deleted_at" TIMESTAMP(6),
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "slides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "tenant_code" TEXT,
    "full_names" TEXT,
    "employment_status" "employment_status",
    "emergency_contact_phone" TEXT,
    "emergency_contact_name" TEXT,
    "occupation" TEXT,
    "monthly_income" TEXT,
    "status" "tenant_status",
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "tenant_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role_assignments" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "role_id" UUID,
    "assigned_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "role" TEXT,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" TEXT,
    "email" TEXT,
    "phone_number" TEXT,
    "is_email_confirmed" BOOLEAN DEFAULT false,
    "is_phone_number_confirmed" BOOLEAN DEFAULT false,
    "is_profile_complete" BOOLEAN DEFAULT false,
    "profile_picture_path" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),
    "is_deleted" BOOLEAN DEFAULT false,
    "notify_system_updates" BOOLEAN DEFAULT true,
    "notify_payment_sms" BOOLEAN DEFAULT true,
    "active_role" TEXT,
    "is_onboarding_complete" BOOLEAN DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "landlord_profiles_user_id_key" ON "landlord_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "landlord_profiles_landlord_code_key" ON "landlord_profiles"("landlord_code");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_plans_plan_id_key" ON "promotion_plans"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "properties_property_code_key" ON "properties"("property_code");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_profiles_user_id_key" ON "tenant_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_profiles_tenant_code_key" ON "tenant_profiles"("tenant_code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- AddForeignKey
ALTER TABLE "account_verification_requests" ADD CONSTRAINT "fk_avr_payment" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "account_verification_requests" ADD CONSTRAINT "fk_avr_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "account_verification_requests" ADD CONSTRAINT "fk_avr_verified_by" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "landlord_profiles" ADD CONSTRAINT "fk_lp_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "fk_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "fk_properties_owner" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "property_applications" ADD CONSTRAINT "fk_pa_landlord" FOREIGN KEY ("landlord_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "property_applications" ADD CONSTRAINT "fk_pa_property" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "property_applications" ADD CONSTRAINT "fk_pa_unit" FOREIGN KEY ("unit_id") REFERENCES "property_units"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "property_applications" ADD CONSTRAINT "fk_pa_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "property_images" ADD CONSTRAINT "fk_property_images_property" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "property_promotions" ADD CONSTRAINT "fk_pp_payment" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "property_promotions" ADD CONSTRAINT "fk_pp_property" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "property_promotions" ADD CONSTRAINT "fk_pp_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "property_tour_requests" ADD CONSTRAINT "fk_ptr_owner" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "property_tour_requests" ADD CONSTRAINT "fk_ptr_property" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "property_tour_requests" ADD CONSTRAINT "fk_ptr_requester" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "property_units" ADD CONSTRAINT "fk_property_units_property" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rent_payments" ADD CONSTRAINT "fk_rp_property" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rent_payments" ADD CONSTRAINT "fk_rp_rental_agreement" FOREIGN KEY ("rental_agreement_id") REFERENCES "rental_agreements"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rent_payments" ADD CONSTRAINT "fk_rp_tenant" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rent_payments" ADD CONSTRAINT "fk_rp_unit" FOREIGN KEY ("unit_id") REFERENCES "property_units"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rental_agreements" ADD CONSTRAINT "fk_ra_owner" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rental_agreements" ADD CONSTRAINT "fk_ra_property" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rental_agreements" ADD CONSTRAINT "fk_ra_template" FOREIGN KEY ("template_id") REFERENCES "rental_agreement_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rental_agreements" ADD CONSTRAINT "fk_ra_tenant" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rental_agreements" ADD CONSTRAINT "fk_ra_unit" FOREIGN KEY ("unit_id") REFERENCES "property_units"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "fk_reviews_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "slide_role_assignments" ADD CONSTRAINT "fk_sra_role" FOREIGN KEY ("role_id") REFERENCES "user_roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "slide_role_assignments" ADD CONSTRAINT "fk_sra_slide" FOREIGN KEY ("slide_id") REFERENCES "slides"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tenant_profiles" ADD CONSTRAINT "fk_tp_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "fk_ura_role" FOREIGN KEY ("role_id") REFERENCES "user_roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "fk_ura_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
