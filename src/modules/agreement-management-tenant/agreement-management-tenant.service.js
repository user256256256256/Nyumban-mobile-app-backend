import prisma from '../../prisma-client.js';
import { generateAgreementPreview } from '../../common/services/generate-agreement-preview.service.js';

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

export const getTenantAgreements = async ({ userId, status, limit = 10, cursor }) => {
  const whereClause = {
    tenant_id: userId,
    is_deleted: false,
    ...(status && { status }),
  };

  // Fetch one extra record for nextCursor determination
  const agreements = await prisma.rental_agreements.findMany({
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
          full_name: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
    take: Number(limit) + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  const hasMore = agreements.length > limit;
  const slicedAgreements = agreements.slice(0, limit);
  const nextCursor = hasMore ? slicedAgreements[slicedAgreements.length - 1].id : null;

  const formatted = slicedAgreements.map((agreement) => ({
    agreement_id: agreement.id,
    status: agreement.status,
    start_date: agreement.start_date?.toISOString().split('T')[0],
    tenant_accepted_agreement: agreement.tenant_accepted_agreement,
    file_path: agreement.file_path,
    property: {
      id: agreement.properties?.id,
      name: agreement.properties?.property_name,
      thumbnail_url: agreement.properties?.thumbnail_image_path,
    },
    owner: {
      id: agreement.users_rental_agreements_owner_idTousers?.id,
      name: agreement.users_rental_agreements_owner_idTousers?.full_name || agreement.users_rental_agreements_owner_idTousers?.username,
      contact: agreement.users_rental_agreements_owner_idTousers?.phone_number,
    },
    created_at: agreement.created_at?.toISOString(),
    updated_at: agreement.updated_at?.toISOString(),
  }));

  return {
    results: formatted,
    nextCursor,
    hasMore,
  };
};

export const cancelAgreement = async ({ agreementId, userId }) => {
  const agreement = await prisma.rental_agreements.findUnique({
    where: { id: agreementId },
    include: { properties: true, property_units: true }
  });

  if (!agreement || agreement.is_deleted) {
    throw new NotFoundError('Agreement not found or already deleted', { field: 'Agreement ID' });
  }

  if (!['pending_payment', 'pending_acceptance', 'draft'].includes(agreement.status)) {
    throw new ForbiddenError('Only non-active agreements can be cancelled');
  }

  if (agreement.tenant_id !== userId && agreement.owner_id !== userId) {
    throw new ForbiddenError('You are not authorized to cancel this agreement', { field: 'User ID' });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const cancelledAgreement = await tx.rental_agreements.update({
      where: { id: agreementId },
      data: {
        tenant_id: null,
        tenant_accepted_agreement: false,
        status: 'cancelled',
        start_date: null,
        updated_at: new Date(),
        is_deleted: true,
        deleted_at: new Date(),
      },
    });

    if (agreement.properties.has_units && agreement.property_units) {
      await tx.property_units.update({
        where: { id: agreement.property_units.id },
        data: { status: 'available' }
      });
    } else {
      await tx.properties.update({
        where: { id: agreement.property_id },
        data: { status: 'available' }
      });
    }

    await tx.property_applications.updateMany({
      where: { property_id: agreement.property_id, tenant_id: agreement.tenant_id },
      data: {
        status: 'rejected',
        landlord_message: 'Agreement cancelled by tenant or landlord',
        reviewed_at: new Date(),
      }
    });

    return cancelledAgreement;
  });

  const propertyName = agreement.properties?.name || 'Property';

  // 🔔 Notifications (non-blocking)
  void (async () => {
    try {
      await triggerNotification(
        agreement.tenant_id,
        'AGREEMENT_CANCELLED',
        'Agreement cancelled',
        `Your agreement for ${propertyName} has been cancelled.`
      );
    } catch (err) {
      console.error('Failed to notify tenant on single agreement cancellation:', err);
    }
  })();

  void (async () => {
    try {
      await triggerNotification(
        agreement.owner_id,
        'AGREEMENT_CANCELLED',
        'Agreement cancelled',
        `You have cancelled the agreement for ${propertyName}.`
      );
    } catch (err) {
      console.error('Failed to notify landlord on single agreement cancellation:', err);
    }
  })();

  return { agreement_id: updated.id, status: updated.status };
};

const ALLOWED_DELETE_STATUSES = ['cancelled', 'terminated', 'draft'];

export const deleteAgreement = async (userId, agreementId) => {
  const agreement = await prisma.rental_agreements.findUnique({
    where: { id: agreementId },
  });

  if (!agreement || agreement.is_deleted) {
    throw new NotFoundError('Agreement not found or already deleted');
  }

  // Authorization: tenant or owner can delete
  if (agreement.tenant_id !== userId && agreement.owner_id !== userId) {
    throw new ForbiddenError('Access denied to delete this agreement');
  }

  if (!ALLOWED_DELETE_STATUSES.includes(agreement.status)) {
    throw new ForbiddenError('Only cancelled, terminated or draft agreements can be deleted');
  }

  // Soft delete the agreement
  await prisma.rental_agreements.update({
    where: { id: agreementId },
    data: { is_deleted: true, deleted_at: new Date() },
  });

  // Check if property or its units have any active agreements left
  const propertyId = agreement.property_id;

  // Count active agreements on the property (without unit)
  const activePropertyAgreementsCount = await prisma.rental_agreements.count({
    where: {
      property_id: propertyId,
      unit_id: null,
      is_deleted: false,
      status: { notIn: ['cancelled', 'terminated', 'draft'] },
    },
  });

  // Count active agreements on any units of the property
  const activeUnitAgreementsCount = await prisma.rental_agreements.count({
    where: {
      property_id: propertyId,
      unit_id: { not: null },
      is_deleted: false,
      status: { notIn: ['cancelled', 'terminated', 'draft'] },
    },
  });

  // If no active agreements on property or units, clear has_agreement flag
  if (activePropertyAgreementsCount + activeUnitAgreementsCount === 0) {
    await prisma.properties.update({
      where: { id: propertyId },
      data: { has_agreement: false },
    });
  }

  return { agreementId };
};

export const deleteAgreementsBatch = async (userId, agreementIds) => {
  const agreements = await prisma.rental_agreements.findMany({
    where: {
      id: { in: agreementIds },
      is_deleted: false,
      OR: [
        { tenant_id: userId },
        { owner_id: userId },
      ],
    },
  });

  const allowed = agreements.filter(a => ALLOWED_DELETE_STATUSES.includes(a.status));
  const allowedIds = allowed.map(a => a.id);

  if (allowedIds.length === 0) {
    throw new ForbiddenError('No deletable agreements found');
  }

  // Soft delete all allowed agreements
  await prisma.rental_agreements.updateMany({
    where: { id: { in: allowedIds } },
    data: { is_deleted: true, deleted_at: new Date() },
  });

  // Collect affected property IDs
  const affectedPropertyIds = [...new Set(allowed.map(a => a.property_id))];

  // For each property, check if any active agreements remain (including unit agreements)
  for (const propertyId of affectedPropertyIds) {
    const activePropertyAgreementsCount = await prisma.rental_agreements.count({
      where: {
        property_id: propertyId,
        unit_id: null,
        is_deleted: false,
        status: { notIn: ['cancelled', 'terminated', 'draft'] },
      },
    });

    const activeUnitAgreementsCount = await prisma.rental_agreements.count({
      where: {
        property_id: propertyId,
        unit_id: { not: null },
        is_deleted: false,
        status: { notIn: ['cancelled', 'terminated', 'draft'] },
      },
    });

    if (activePropertyAgreementsCount + activeUnitAgreementsCount === 0) {
      await prisma.properties.update({
        where: { id: propertyId },
        data: { has_agreement: false },
      });
    }
  }

  return { deleted_count: allowedIds.length };
};

export const cancelAgreements = async (userId, agreementIds) => {
  const agreements = await prisma.rental_agreements.findMany({
    where: { id: { in: agreementIds }, is_deleted: false },
    include: { properties: true, property_units: true },
  });

  const cancellable = agreements.filter(agreement =>
    (agreement.tenant_id === userId || agreement.owner_id === userId) &&
    ['pending_payment', 'pending_acceptance', 'draft'].includes(agreement.status)
  );

  if (cancellable.length === 0) {
    throw new ForbiddenError('No cancellable agreements found');
  }

  const cancelledResults = await prisma.$transaction(async (tx) => {
    const results = [];

    for (const agreement of cancellable) {
      const updatedAgreement = await tx.rental_agreements.update({
        where: { id: agreement.id },
        data: {
          tenant_id: null,
          tenant_accepted_agreement: false,
          status: 'cancelled',
          start_date: null,
          updated_at: new Date(),
          is_deleted: true,
          deleted_at: new Date(),
        },
      });

      if (agreement.properties.has_units && agreement.property_units) {
        await tx.property_units.update({
          where: { id: agreement.property_units.id },
          data: { status: 'available' },
        });
      } else {
        await tx.properties.update({
          where: { id: agreement.property_id },
          data: { status: 'available' },
        });
      }

      await tx.property_applications.updateMany({
        where: { property_id: agreement.property_id, tenant_id: agreement.tenant_id },
        data: {
          status: 'rejected',
          landlord_message: 'Agreement cancelled by tenant or landlord',
          reviewed_at: new Date(),
        }
      });

      results.push(updatedAgreement);
    }

    return results;
  });

  // 🔔 Notifications (non-blocking)
  for (const agreement of cancellable) {
    const propertyName = agreement.properties?.name || 'Property';

    void (async () => {
      try {
        await triggerNotification(
          agreement.tenant_id,
          'AGREEMENT_CANCELLED',
          'Agreement cancelled',
          `Your agreement for ${propertyName} has been cancelled.`
        );
      } catch (err) {
        console.error('Failed to notify tenant on agreement cancellation:', err);
      }
    })();

    void (async () => {
      try {
        await triggerNotification(
          agreement.owner_id,
          'AGREEMENT_CANCELLED',
          'Agreement cancelled',
          `You have cancelled the agreement for ${propertyName}.`
        );
      } catch (err) {
        console.error('Failed to notify landlord on agreement cancellation:', err);
      }
    })();
  }

  return {
    cancelled_count: cancelledResults.length,
    cancelled_ids: cancelledResults.map(a => a.id),
  };
};


export default {
  getLeaseAgreement,
  getTenantAgreements,
  cancelAgreement,
  deleteAgreement,
  deleteAgreementsBatch,
  cancelAgreements
};

