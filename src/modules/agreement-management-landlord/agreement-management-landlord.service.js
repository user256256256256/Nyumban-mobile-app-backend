import { ServerError } from '../../common/services/errors-builder.service.js';
import prisma from '../../prisma-client.js';

export const getAllLandlordAgreements = async ({ landlordId, status, cursor, limit = 10 }) => {
  const where = {
    owner_id: landlordId,
    is_deleted: false,
    ...(status && { status }),
  };

  // Fetch one extra record for pagination
  const agreements = await prisma.rental_agreements.findMany({
    where,
    include: {
      properties: {
        select: { property_name: true },
      },
      property_units: {
        select: { unit_number: true },
      },
      users_rental_agreements_tenant_idTousers: {
        select: {
          username: true,
          email: true,
          phone_number: true,
          tenant_profiles: {
            select: { full_names: true },
          },
        },
      },
    },
    orderBy: { created_at: 'desc' },
    take: Number(limit) + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  if (!agreements) {
    throw new ServerError('Unknown error occurred');
  }

  const hasMore = agreements.length > limit;
  const slicedAgreements = agreements.slice(0, limit);
  const nextCursor = hasMore
    ? slicedAgreements[slicedAgreements.length - 1].id
    : null;

  const formatted = slicedAgreements.map((a) => {
    const tenant = a.users_rental_agreements_tenant_idTousers;

    return {
      agreement_id: a.id,
      property: {
        property_name: a.properties?.property_name || '—',
        unit_number: a.property_units?.unit_number || null,
      },
      applier: tenant
        ? {
            applier_name:
              tenant.tenant_profiles?.full_names ||
              tenant.username ||
              '—',
            applier_contact:
              tenant.phone_number ||
              tenant.email ||
              '—',
          }
        : null,
      status: a.status,
      created_at: a.created_at?.toISOString(),
      last_updated: a.updated_at?.toISOString(),
    };
  });

  return {
    results: formatted,
    nextCursor,
    hasMore,
  };
};

export default {
  getAllLandlordAgreements
}