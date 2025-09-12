import prisma from '../../prisma-client.js';

import {
  NotFoundError,
  ServerError,
  ForbiddenError,
  AuthError,
} from '../../common/services/errors-builder.service.js';

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
          landlord_profiles: {
            select: {
              full_names: true,
            },
          },
        },
      },
    },
    orderBy: { created_at: 'desc' },
    take: Number(limit) + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  if (!agreements) throw new ServerError('Unknown error occurred');

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
      name:
        agreement.users_rental_agreements_owner_idTousers?.landlord_profiles?.full_names ||
        agreement.users_rental_agreements_owner_idTousers?.username,
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

export const acceptAgreement = async (userId, agreementId, payload) => {
  const { accepted } = payload;
  if (!accepted) throw new AuthError('You must accept the agreement to proceed', { field: 'Accepted: true' });

  const agreement = await prisma.rental_agreements.findUnique({
    where: { id: agreementId },
    include: { users_rental_agreements_tenant_idTousers: true, properties: true }
  });

  if (!agreement) throw new NotFoundError('Agreement not found', { field: 'Agreement ID' });
  // ✅ Allow acceptance if status is "ready" OR "cancelled"
  if (!['ready', 'cancelled'].includes(agreement.status)) throw new ForbiddenError( 'Agreement is not ready or cancelled for acceptance', { field: 'Agreement Status' });
  if (agreement.tenant_id !== userId) throw new AuthError('You are not authorized to accept this agreement');
  if (agreement.tenant_accepted_agreement) throw new ForbiddenError('Agreement has already been accepted');

  const updatedAgreement = await prisma.rental_agreements.update({
    where: { id: agreementId },
    data: {
      tenant_accepted_agreement: true,
      updated_at: new Date(),
      status: 'pending_payment',
    }
  });

  const propertyName = agreement.properties?.name || 'Property';

  // 🔔 Notification (non-blocking)
  void (async () => {
    try {
      await triggerNotification(
        agreement.owner_id,
        'user',
        'Agreement accepted by tenant',
        `Your agreement for ${propertyName} was accepted by the tenant.`
      );
    } catch (err) {
      console.error('Failed to notify landlord on agreement acceptance:', err);
    }

    try {
      await triggerNotification(
        userId,
        'user',
        'Agreement accepted by tenant',
        `Your agreement for ${propertyName} was accepted by the tenant.`
      );
    } catch (err) {
      console.error('Failed to notify landlord on agreement acceptance:', err);
    }
  })();

  return updatedAgreement;
};

export default {
  getTenantAgreements,
  acceptAgreement,
};

