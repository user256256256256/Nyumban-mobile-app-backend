import prisma from '../../prisma-client.js';
import { v4 as uuidv4 } from 'uuid';
import { triggerNotification } from '../notifications/notification.service.js';

import {
    NotFoundError,
    AuthError,
    ForbiddenError,
    ServerError,
} from '../../common/services/errors-builder.service.js';

export const createOrUpdateDraft = async (userId, propertyId, unitId, payload) => {
  const { security_deposit, utility_responsibilities, status } = payload;

  const property = await prisma.properties.findUnique({ where: { id: propertyId } });
  if (!property) throw new NotFoundError('Property not found', { field: 'Property ID' });
  if (property.owner_id !== userId) throw new AuthError('Access denied', { field: 'Owner ID' });
  if (property.has_units && !unitId)
    throw new ForbiddenError('Property has units; specify unit_id', { field: 'Unit ID' });

  if (unitId) {
    const unit = await prisma.property_units.findUnique({ where: { id: unitId } });
    if (!unit || unit.property_id !== propertyId)
      throw new NotFoundError('Unit not found or does not belong to this property', { field: 'Unit ID' });
  }

  const template = await prisma.rental_agreement_templates.findFirst({
    orderBy: { updated_at: 'desc' },
    select: { id: true },
  });
  if (!template) throw new NotFoundError('No agreement template available');

  // Check for existing draft or ready agreements
  const existingActive = await prisma.rental_agreements.findFirst({
    where: {
      property_id: propertyId,
      unit_id: unitId ?? null,
      owner_id: userId,
      is_deleted: false,
      status: { in: ['draft', 'ready'] },
    },
  });

  if (existingActive && existingActive.status === 'ready') {
    throw new ForbiddenError(
      'A finalized agreement already exists for this property/unit. You cannot create or update a draft.'
    );
  }

  const commonData = {
    rental_agreement_templates: { connect: { id: template.id } },
    properties: { connect: { id: propertyId } },
    property_units: unitId ? { connect: { id: unitId } } : undefined,
    users_rental_agreements_owner_idTousers: { connect: { id: userId } },
    status,
    security_deposit,
    utility_responsibilities,
    updated_at: new Date(),
  };

  let agreement;

  if (existingActive && existingActive.status === 'draft') {
    // ✅ Update the existing draft
    agreement = await prisma.rental_agreements.update({
      where: { id: existingActive.id },
      data: commonData,
    });
  } else {
    // ✅ Create a new draft (no draft exists)
    agreement = await prisma.rental_agreements.create({
      data: {
        id: uuidv4(),
        ...commonData,
        created_at: new Date(),
      },
    });
  }

  // Mark the property as having an agreement
  await prisma.properties.update({
    where: { id: propertyId },
    data: { has_agreement: true },
  });

  return { agreement_id: agreement.id, status: agreement.status };
};

export const finalizeAgreement = async (userId, propertyId, unitId, status) => {
  const property = await prisma.properties.findUnique({ where: { id: propertyId } });

  if (!property) throw new NotFoundError('Property not found', { field: 'Propert ID' });
  if (property.owner_id !== userId) throw new AuthError('Access denied', { field: 'Owner ID' });
  if (property.has_units && !unitId) 
    throw new ForbiddenError('Property has units; specify unit_id', { field: 'Unit ID' });
  
  if (unitId) {
    const unit = await prisma.property_units.findUnique({ where: { id: unitId } });
    if (!unit || unit.property_id !== propertyId) {
      throw new NotFoundError('Unit not found or does not belong to this property', { field: 'Unit ID' });
    }
  }

  const agreement = await prisma.rental_agreements.findFirst({
    where: {
      property_id: propertyId,
      unit_id: property.has_units ? unitId : null
    }
  });

  if (!agreement) throw new NotFoundError('Agreement not found for this property/unit');
  if (agreement.owner_id !== userId) throw new ForbiddenError('You are not authorized to finalize this agreement', { field: 'User ID' });
  if (agreement.tenant_accepted_agreement) throw new AuthError('Agreement has already been signed by the tenant');
  if (agreement.status === 'ready') throw new ServerError('Agreement is already finalized', { field: 'Status' });

  const updatedAgreement = await prisma.rental_agreements.update({
    where: { id: agreement.id },
    data: {
      status,
      updated_at: new Date()
    }
  });

  // 🔔 Notify landlord that the agreement has been finalized
  void (async () => {
    try {
      await triggerNotification(
        property.owner_id,
        'AGREEMENT_FINALIZED',
        'Agreement Finalized',
        `You have successfully finalized the rental agreement for ${property.title || 'the property'}.`
      );
    } catch (err) {
      console.error(`Failed to send notification for finalized agreement ${agreement.id}:`, err);
    }
  })();

  return updatedAgreement;
};

export default {
  createOrUpdateDraft,
  finalizeAgreement,
}