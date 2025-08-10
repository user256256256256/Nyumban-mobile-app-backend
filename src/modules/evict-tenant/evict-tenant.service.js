import prisma from '../../prisma-client.js';
import dayjs from 'dayjs';
import { NotFoundError, ForbiddenError } from '../../common/services/errors-builder.service.js';
import { triggerNotification } from '../notifications/notification.service.js';

const GRACE_PERIOD_DAYS = 7; // configurable

export const initiateEviction = async ({ landlordId, tenantId, propertyId, unitId, reason }) => {
  const agreement = await prisma.rental_agreements.findFirst({
    where: { tenant_id: tenantId, property_id: propertyId, unit_id: unitId || undefined, owner_id: landlordId, status: 'active', is_deleted: false },
  });
  if (!agreement) throw new NotFoundError('No active agreement found for eviction');

  // 1. Check unpaid rent
  const unpaidRent = await prisma.rent_payments.findFirst({
    where: { tenant_id: tenantId, property_id: propertyId, status: 'unpaid' },
  });
  if (!unpaidRent) throw new ForbiddenError('Tenant has no unpaid rent, eviction not allowed.');

  const gracePeriodEnd = dayjs().add(GRACE_PERIOD_DAYS, 'day').toDate();

  // 2. Create eviction log
  const evictionLog = await prisma.eviction_logs.create({
    data: {
      tenant_id: tenantId,
      landlord_id: landlordId,
      property_id: propertyId,
      unit_id: unitId,
      reason,
      status: 'warning',
      warning_sent_at: new Date(),
      gracePeriodEnd: gracePeriodEnd,
    },
  });

  // 3. Send eviction warning notification
  await triggerNotification(
    tenantId,
    'user',
    'Eviction Warning Issued',
    `You have ${GRACE_PERIOD_DAYS} days to resolve unpaid rent or eviction will be enforced. Reason: ${reason || 'Unpaid rent'}`
  );

  return {
    status: 'warning_issued',
    gracePeriodEnd: gracePeriodEnd,
    eviction_log: evictionLog,
  };
};

export const finalizeEviction = async ({ landlordId, evictionLogId }) => {
  const log = await prisma.eviction_logs.findUnique({ where: { id: evictionLogId } });

  if (!log || log.status !== 'warning') throw new NotFoundError('No active eviction warning found.');
  if (log.landlord_id !== landlordId) throw new ForbiddenError('You cannot finalize an eviction you did not initiate.');

  if (dayjs().isBefore(log.gracePeriodEnd)) {
    throw new ForbiddenError('Grace period has not expired yet.');
  }

  const agreement = await prisma.rental_agreements.findFirst({
    where: {
      tenant_id: log.tenant_id,
      property_id: log.property_id,
      unit_id: log.unit_id || undefined,
      owner_id: landlordId,
      status: 'active',
    },
  });

  if (agreement) {
    await prisma.rental_agreements.update({
      where: { id: agreement.id },
      data: { status: 'terminated', updated_at: new Date() },
    });
  }

  if (log.unit_id) {
    await prisma.property_units.update({ where: { id: log.unit_id }, data: { status: 'available' } });
  } else {
    await prisma.properties.update({ where: { id: log.property_id }, data: { status: 'available' } });
  }

  await prisma.eviction_logs.update({
    where: { id: evictionLogId },
    data: { status: 'evicted', updated_at: new Date() },
  });

  await triggerNotification(
    log.tenant_id,
    'user',
    'Eviction Finalized',
    'Your grace period has expired. Your lease has been terminated.'
  );

  return { status: 'evicted', eviction_log_id: evictionLogId };
};

export default {
  initiateEviction,
  finalizeEviction
}