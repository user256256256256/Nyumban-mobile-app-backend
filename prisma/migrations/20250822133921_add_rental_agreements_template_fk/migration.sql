-- AddForeignKey
ALTER TABLE "public"."rental_agreements" ADD CONSTRAINT "rental_agreements_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."rental_agreement_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
