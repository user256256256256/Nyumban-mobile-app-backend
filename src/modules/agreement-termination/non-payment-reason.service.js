import prisma from '../../prisma-client.js';
import { finalizeEvictionAndTerminateAgreement } from './evict.util.js';
import { NotFoundError, ForbiddenError } from '../../common/services/errors-builder.service.js';
import { triggerNotification } from '../notifications/notification.service.js';

export const initiateEviction = async ({
  agreement,
  reason,
  initiatedBy,
  description,
  graceDays = 7,
}) => {
  const now = new Date();
  const graceEnd = new Date(now.getTime() + graceDays * 24 * 60 * 60 * 1000);

  // Create eviction log with relation to agreement only
  const evictionLog = await prisma.eviction_logs.create({
    data: {
      agreement_id: agreement.id,
      reason,
      status: 'warning',
      warning_sent_at: now,
      grace_period_end: graceEnd,
      created_at: now,
      updated_at: now,
    },
  });

  // Optional: trigger notifications (can also be handled in terminateAgreement)
  if (agreement.tenant?.id) {
    void triggerNotification(
      agreement.tenant.id,
      'user',
      'Eviction Notice (Non-Payment)',
      `Eviction initiated. Grace period ends on ${graceEnd.toDateString()}.`
    );
  }

  if (agreement.landlord?.id) {
    void triggerNotification(
      agreement.landlord.id,
      'user',
      'Eviction Initiated',
      `You initiated eviction for agreement ${agreement.id}.`
    );
  }

  return evictionLog;
};

export const cancelEviction = async ({ evictionId, userId, userRole, reason }) => {
    const eviction = await prisma.eviction_logs.findUnique({
    where: { id: evictionId },
    include: {
        agreement: {
        include: { tenant: true, landlord: true },
        },
    },
    });

    if (!eviction) throw new NotFoundError('Eviction record not found');

    if (userRole !== 'landlord' && userRole !== 'admin') {
    throw new ForbiddenError('Only landlord or admin can cancel eviction');
    }

    if (eviction.status === eviction_status.evicted) {
    throw new ForbiddenError('Eviction already finalized. Cannot cancel.');
    }

    const updatedEviction = await prisma.eviction_logs.update({
    where: { id: evictionId },
    data: {
        status: eviction_status.cancelled,
        updated_at: new Date(),
        reason: reason || eviction.reason,
    },
    });

    // ✅ Notify tenant
    if (eviction.agreement?.tenant?.id) {
    void triggerNotification(
        eviction.agreement.tenant.id,
        'user',
        'Eviction Cancelled',
        'Your eviction has been cancelled by the landlord/admin.'
    );
    }

    // ✅ Notify landlord
    if (eviction.agreement?.landlord?.id) {
    void triggerNotification(
        eviction.agreement.landlord.id,
        'user',
        'Eviction Cancelled',
        'You have successfully cancelled the eviction.'
    );
    }

    return updatedEviction;
};
  
export const confirmEviction = async ({ evictionId, userId, userRole }) => {
  const eviction = await prisma.eviction_logs.findUnique({
    where: { id: evictionId },
    include: {
      agreement: {
        include: { tenant: true, landlord: true, property: true, unit: true },
      },
    },
  });

  if (!eviction) throw new NotFoundError('Eviction record not found');

  if (userRole !== 'landlord' && userRole !== 'admin') {
    throw new ForbiddenError('Only landlord or admin can confirm eviction');
  }

  if (eviction.status === eviction_status.evicted) {
    throw new ForbiddenError('Eviction already confirmed');
  }

  if (eviction.status === eviction_status.cancelled) {
    throw new ForbiddenError('Cancelled eviction cannot be confirmed');
  }

  return finalizeEvictionAndTerminateAgreement({ eviction, isAuto: false });
};


export default {
    initiateEviction,
    cancelEviction,
    confirmEviction, 
};
  
