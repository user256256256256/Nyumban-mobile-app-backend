import prisma from '../../prisma-client.js';
import { generateAgreementPreview } from './generate-agreement-preview.service.js';

import {
  NotFoundError,
  AuthError,
  ServerError,
  ForbiddenError,
} from '../../common/services/errors-builder.service.js';


export const getLeaseAgreement = async (userId, propertyId, unitId = null) => {

    const property = await prisma.properties.findUnique({ where: { id: propertyId } });
  
    if (!property) throw new NotFoundError('Property not found', { field: 'Property ID' });

    if (property.has_units && !unitId) {
      throw new NotFoundError('This property has units. Specify a unitId', { field: 'Unit ID' });
    }
  
    // Check if user is the tenant in an active/completed agreement
    const agreement = await prisma.rental_agreements.findFirst({
      where: {
        property_id: propertyId,
        unit_id: unitId ?? null,
        tenant_id: userId,
        tenant_accepted_agreement: true,
        status: { in: ['active', 'completed'] },
        is_deleted: false,
      },
      orderBy: { updated_at: 'desc' },
    });
  
    if (!agreement) {
      throw new NotFoundError('No valid lease agreement found for this property/unit and tenant');
    }

    const rendered_html = await generateAgreementPreview(agreement.id);
  
    return {
      agreementId: agreement.id, 
      property_id: propertyId,
      pdf_url: agreement.file_path,
      rendered_html
    };
};

export const getTenantAgreements = async ({ userId, status, limit = 10, offset = 0 }) => {
  const whereClause = {
    tenant_id: userId,
    is_deleted: false,
  };

  if (status) {
    whereClause.status = status;
  }

  const [total, agreements] = await Promise.all([
    prisma.rental_agreements.count({ where: whereClause }),
    prisma.rental_agreements.findMany({
      where: whereClause,
      include: {
        properties: {
          select: {
            id: true,
            property_name: true,
            thumbnail_image_path: true,
          },
        },
        users_rental_agreements_owner_idTousers: {
          select: {
            id: true,
            username: true,
            phone_number: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
    }),
  ]);

  const formatted = agreements.map((agreement) => ({
    agreement_id: agreement.id,
    status: agreement.status,
    start_date: agreement.start_date?.toISOString().split('T')[0],
    end_date: agreement.end_date?.toISOString().split('T')[0],
    tenant_accepted_agreement: agreement.tenant_accepted_agreement,
    file_path: agreement.file_path,
    property: {
      id: agreement.properties?.id,
      name: agreement.properties?.property_name,
      thumbnail_url: agreement.properties?.thumbnail_image_path,
    },
    owner: {
      id: agreement.users_rental_agreements_owner_idTousers?.id,
      name: agreement.users_rental_agreements_owner_idTousers?.full_name,
      contact: agreement.users_rental_agreements_owner_idTousers?.phone_number,
    },
    created_at: agreement.created_at?.toISOString(),
    updated_at: agreement.updated_at?.toISOString(),
  }));

  return {
    total,
    limit,
    offset,
    agreements: formatted,
  };
};

export const cancelAgreement = async ({ agreementId, userId }) => {
  const agreement = await prisma.rental_agreements.findUnique( { where: { id: agreementId } })
  if (!agreement || agreement.is_deleted) throw new NotFoundError('Agreement not found or already deleted', { field: 'Agreement ID'});
  
  if (agreement.status === 'active') throw new ForbiddenError('Active agreements cannot be canceled')
  
  if (agreement.tenant_id !== userId && agreement.owner_id !== userId) {
    throw new ForbiddenError('You are not authorized to cancel this agreement', { field: 'User ID' });
  }

  const updated = await prisma.rental_agreements.update({
    where: { id: agreementId },
    data: {
      tenant_id: null,
      tenant_accepted_agreement: false,
      status: 'cancelled',
      start_date: null,
      end_date: null,
      updated_at: new Date(),
      is_deleted: true,
      deleted_at: new Date(),
    },
  });


  return {
    agreement_id: updated.id,
    status: updated.status,
  };

}

export default {
  getLeaseAgreement,
  getTenantAgreements,
  cancelAgreement
};

