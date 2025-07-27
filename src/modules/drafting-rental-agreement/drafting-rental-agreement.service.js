import prisma from '../../prisma-client.js';
import { v4 as uuidv4 } from 'uuid';
import Handlebars from 'handlebars';

import {
    ValidationError,
    NotFoundError,
    AuthError,
    ForbiddenError,
    ServerError,
} from '../../common/services/errors-builder.service.js';

export const checkAgreementExists = async (userId, propertyId, unitId) => {
    const property = await prisma.properties.findUnique({
      where: { id: propertyId }
    })
  
    if (!property) throw new NotFoundError('Property not found', { field: 'Property ID' })
  
    if (property.owner_id !== userId)
      throw new AuthError('Access denied. You are not the owner of this property.', { field: 'Owner ID' })
  
    if (property.has_units && !unitId)
      throw new ForbiddenError('Property has units, specify the unit to check agreement status', { field: 'Unit ID' })
  
    if (unitId) {
      const unit = await prisma.property_units.findUnique({ where: { id: unitId } })
      if (!unit || unit.property_id !== propertyId)
      throw new NotFoundError('Unit not found or does not belong to this property', { field: 'Unit ID' })
    }

    const whereClause = {
      property_id: propertyId,
      owner_id: userId,
      unit_id: unitId ?? null,
      is_deleted: false,
    }
  
    const agreement = await prisma.rental_agreements.findFirst({
      where: whereClause,
      orderBy: { updated_at: 'desc' },
      select: {
        id: true,
        status: true,
        updated_at: true,
      },
    })
  
    if (!agreement) return { exists: false }
  
    return {
      exists: true,
      agreement_id: agreement.id,
      status: agreement.status,
      last_modified: agreement.updated_at,
    }
}

export const createOrSaveDraft = async (userId, propertyId, unitId, payload) => {
  const { security_deposit, utility_responsibilities, status } = payload;
  
  const property = await prisma.properties.findUnique({ where: { id: propertyId } });
  
  if (!property) throw new NotFoundError('Property not found', { field: 'Property ID' });
  if (property.owner_id !== userId) throw new AuthError('Access denied', { field: 'Owner ID' });
  if (property.has_units && !unitId) 
    throw new ForbiddenError('Property has units; specify unit_id', { field: 'Unit ID' });
  
  if (unitId) {
    const unit = await prisma.property_units.findUnique({ where: { id: unitId } })
    if (!unit || unit.property_id !== propertyId)
    throw new NotFoundError('Unit not found or does not belong to this property', { field: 'Unit ID' })
  }

  const template = await prisma.rental_agreement_templates.findFirst({
    orderBy: { updated_at: 'desc' },
    select: { id: true }
  });
  if (!template) throw new NotFoundError('No agreement template available');

  const existing = await prisma.rental_agreements.findFirst({
    where: {
      property_id: propertyId,
      unit_id: unitId ?? null,
      owner_id: userId,
      status: 'draft',
      is_deleted: false,
    }
  });

  const commonData = {
    rental_agreement_templates: { connect: { id: template.id } },
    properties: { connect: { id: propertyId } },
    property_units: unitId ? { connect: { id: unitId } } : undefined,
    users_rental_agreements_owner_idTousers: {  connect: { id: userId } },
    status,
    security_deposit,
    utility_responsibilities,
    updated_at: new Date(),
  };

  let agreement;

  if (existing) {
    agreement = await prisma.rental_agreements.update({
      where: { id: existing.id },
      data: commonData
    });
  } else {
    agreement = await prisma.rental_agreements.create({
      data: {
        id: uuidv4(),
        ...commonData,
        created_at: new Date(),
      }
    });
  }

  return {
    agreement_id: agreement.id,
    status: agreement.status
  };

}

export const generateAgreementPreview = async (agreementId) => {
  const agreement = await prisma.rental_agreements.findUnique({
    where: { id: agreementId },
    include: {
      rental_agreement_templates: true,
      properties: true,
      property_units: true,
      users_rental_agreements_owner_idTousers: {
        include: {
          landlord_profiles: true, // <-- Include landlord profile here
        }
      },
      users_rental_agreements_tenant_idTousers: true,
    }
  });

  if (!agreement) {
    throw new NotFoundError('Agreement not found', { field: 'Agreement ID' });
  }

  const template = agreement.rental_agreement_templates?.template_html;

  if (!template) {
    throw new NotFoundError('Agreement template not found');
  }

  const data = {
    agreement_id: agreement.id,
    property_name: agreement.properties?.property_name,
    unit_name: agreement.property_units?.unit_number,
    owner_name: agreement.users_rental_agreements_owner_idTousers?.landlord_profiles?.full_names ?? 'N/A',
    landlord_name: agreement.users_rental_agreements_owner_idTousers?.landlord_profiles?.full_names ?? 'N/A',
    landlord_contact: agreement.users_rental_agreements_owner_idTousers?.phone_number ?? 'N/A',
    security_deposit: agreement.security_deposit,
    utility_responsibilities: agreement.utility_responsibilities,
    status: agreement.status,
    ugandan_badge_url: 'https://example.com/ugandan-badge.png',
    nps_logo_url: 'https://example.com/nps-logo.png',
    agreement_signed_date: new Date().toLocaleDateString(),
    agreement_signed_time: new Date().toLocaleTimeString(),
    agreement_signed_timestamp: new Date().toISOString()
  };

  const compiled = Handlebars.compile(template);
  const rendered_html = compiled(data);

  console.log('[Compiled HTML]', rendered_html);

  return { rendered_html };
};

export const finalizeAgreement = async (userId, propertyId, unitId, status) => {
  const property = await prisma.properties.findUnique({ where: { id: propertyId } });

  if (!property) throw new NotFoundError('Property not found', { field: 'Propert ID' });
  if (property.owner_id !== userId) throw new AuthError('Access denied', { field: 'Owner ID' });
  if (property.has_units && !unitId) 
    throw new ForbiddenError('Property has units; specify unit_id', { field: 'Unit ID' });
  
  if (unitId) {
    const unit = await prisma.property_units.findUnique({ where: { id: unitId } })
    if (!unit || unit.property_id !== propertyId)
    throw new NotFoundError('Unit not found or does not belong to this property', { field: 'Unit ID' })
  }

  const agreement = await prisma.rental_agreements.findFirst({
    where: {
      property_id: propertyId,
      unit_id: property.has_units ? unitId : null
    }
  })

  if (!agreement)  throw new NotFoundError('Agreement not found for this property/unit')

  if (agreement.owner_id !== userId) throw new ForbiddenError('You are not authorized to finalize this agreement', { field: 'User ID' } )
 
  if (agreement.tenant_accepted_agreement) throw new AuthError('Agreement has already been signed by the tenant')

  if (agreement.status === 'ready') throw new ServerError('Agreement is already finalized', { field: 'Status' })

  const updatedAgreement = await prisma.rental_agreements.update({
    where: { id: agreement.id },
    data: {
      status,
      updated_at: new Date()
    }
  })

  return updatedAgreement
}

export default {
    checkAgreementExists,
    createOrSaveDraft,
    generateAgreementPreview,
    finalizeAgreement,
}