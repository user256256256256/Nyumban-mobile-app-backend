import prisma from '../../prisma-client.js';
import Handlebars from 'handlebars';
import {
    NotFoundError,
} from './errors-builder.service.js';

export const generateAgreementPreview = async (agreementId) => {
  const agreement = await prisma.rental_agreements.findUnique({
    where: { id: agreementId },
    include: {
      rental_agreement_templates: true,
      properties: true, 
      property_units: true,
      users_rental_agreements_owner_idTousers: {
        include: {
          landlord_profiles: true,
        },
      },
      users_rental_agreements_tenant_idTousers: {
        include: {
          tenant_profiles: true,
        },
      },
    },
  });

  if (!agreement) {
    throw new NotFoundError('Agreement not found', { field: 'Agreement ID' });
  }

  const template = agreement.rental_agreement_templates?.template_html;
  if (!template) {
    throw new NotFoundError('Agreement template not found');
  }

  const tenant = agreement.users_rental_agreements_tenant_idTousers;
  const tenantProfile = tenant?.tenant_profiles;
  const now = new Date();

  const data = {
    agreement_id: agreement.id,
    property_name: agreement.properties?.property_name,
    unit_name: agreement.property_units?.unit_number ?? 'N/A',
    landlord_name: agreement.users_rental_agreements_owner_idTousers?.landlord_profiles?.full_names ?? 'N/A',
    landlord_contact: agreement.users_rental_agreements_owner_idTousers?.phone_number ?? 'N/A',

    // 🧑‍💼 Tenant Info
    tenant_name: tenantProfile?.full_names ?? tenant?.full_name ?? 'N/A',
    tenant_contact: tenant?.phone_number ?? 'N/A',
    emergency_contact_name: tenantProfile?.emergency_contact_name ?? 'N/A',
    emergency_contact_phone: tenantProfile?.emergency_contact_phone ?? 'N/A',
    tenant_occupation: tenantProfile?.occupation ?? 'N/A',
    tenant_employment_status: tenantProfile?.employment_status ?? 'N/A',

    // 📄 Agreement Info
    security_deposit: agreement.security_deposit ?? '0',
    utility_responsibility: agreement.utility_responsibilities ?? 'N/A',
    date_rented: agreement.start_date?.toLocaleDateString() ?? now.toLocaleDateString(),
    monthly_rent: agreement.monthly_rent,
    pet_policy: agreement.properties?.pet_policy ?? 'Not specified',
    smoking_policy: agreement.properties?.smoking_policy ?? 'Not specified',

    // Static/auto-generated
    agreement_signed_date: now.toLocaleDateString(),
    agreement_signed_time: now.toLocaleTimeString(),
    agreement_signed_timestamp: now.toISOString(),
    ugandan_badge_url: 'https://example.com/ugandan-badge.png',
    nps_logo_url: 'https://example.com/nps-logo.png',
  };

  const compiled = Handlebars.compile(template);
  const rendered_html = compiled(data);

  return  rendered_html ;
};
