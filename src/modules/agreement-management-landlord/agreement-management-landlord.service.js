import { ServerError } from '../../common/services/errors-builder.service.js';
import prisma from '../../prisma-client.js';

export const getAllLandlordAgreements = async ({ landlordId, status, cursor, limit = 10 }) => {
  const where = {
    owner_id: landlordId,
    is_deleted: false,
    ...(status && { status }),
  };

  // Fetch one extra record for nextCursor determination
  const agreements = await prisma.rental_agreements.findMany({
    where,
    include: {
      properties: {
        select: {
          property_name: true,
        },
      },
      property_units: {
        select: {
          unit_number: true,
        },
      },
      users_rental_agreements_tenant_idTousers: {
        select: {
          username: true,
          phone_number: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
    take: Number(limit) + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  if (!agreements) throw new ServerError('Unknown error occured')

  const hasMore = agreements.length > limit;
  const slicedAgreements = agreements.slice(0, limit);
  const nextCursor = hasMore ? slicedAgreements[slicedAgreements.length - 1].id : null;

  const formatted = slicedAgreements.map((a) => ({
    agreement_id: a.id,
    property: {
      property_name: a.properties?.property_name || '—',
      unit_number: a.property_units?.unit_number || null,
    },
    applier: a.users_rental_agreements_tenant_idTousers
      ? {
          applier_name: a.users_rental_agreements_tenant_idTousers.username,
          applier_contact: a.users_rental_agreements_tenant_idTousers.phone_number,
        }
      : null,
    status: a.status,
    initiated_at: a.created_at,
  }));

  return {
    results: formatted,
    nextCursor,
    hasMore,
  };
};

export default {
  getAllLandlordAgreements
}