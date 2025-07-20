import prisma from '../../prisma-client.js';
import dayjs from 'dayjs';
import {
  NotFoundError,
  ForbiddenError,
  ServerError,
} from '../../common/services/errors.js';

export const evictTenant = async ({ landlordId, tenantId, propertyId, unitId, reason }) => {
  // 1. Locate active lease
  const agreement = await prisma.rental_agreements.findFirst({
    where: {
      tenant_id: tenantId,
      property_id: propertyId,
      unit_id: unitId || undefined,
      owner_id: landlordId,
      status: 'active',
      is_deleted: false,
    },
  });
  if (!agreement) throw new NotFoundError('No active agreement found for eviction');

  // 2. Create audit record (optional table — here inline)
  const terminatedAt = new Date();

  // Delete tenant application record also 

  // 3. Update agreement status
  await prisma.rental_agreements.update({
    where: { id: agreement.id },
    data: {
      status: 'terminated',
      updated_at: terminatedAt,
    },
  });

  // 4. Mark property or unit available
  if (unitId) {
    await prisma.property_units.update({
      where: { id: unitId },
      data: { status: 'available' },
    });
  } else {
    await prisma.properties.update({
      where: { id: propertyId },
      data: { status: 'available' },
    });
  }

  // 5. Optionally clear tenant fields (security)
  await prisma.rental_agreements.update({
    where: { id: agreement.id },
    data: { tenant_id: null },
  });

  return {
    status: 'success',
    message: 'Tenant eviction processed. Lease agreement terminated.',
    eviction_record: {
      tenant_id: tenantId,
      property_unit_id: unitId ?? null,
      terminated_at: terminatedAt.toISOString(),
      terminated_by: landlordId,
      reason: reason || '',
    },
  };
};

export default {
  evictTenant,
};
