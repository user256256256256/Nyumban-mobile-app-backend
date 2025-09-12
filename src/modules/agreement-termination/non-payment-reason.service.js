import prisma from '../../prisma-client.js';
import { finalizeEvictionAndTerminateAgreement } from './evict.util.js';
import { NotFoundError, ForbiddenError } from '../../common/services/errors-builder.service.js';
import { triggerNotification } from '../notifications/notification.service.js';

export const initiateEviction = async ({ agreement, reason, graceDays = 7 }) => {
  const now = new Date();
  const graceEnd = new Date(now.getTime() + graceDays * 24 * 60 * 60 * 1000);

  // Compose property label
  const propertyName = agreement.properties?.property_name || 'Property';
  const unitNumber = agreement.property_units?.unit_number
    ? ` - Unit ${agreement.property_units.unit_number}`
    : '';
  const propertyLabel = `${propertyName}${unitNumber}`;

  // Create eviction log
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

  // Debug: tenant info
  console.log('[Eviction Debug] Tenant details:', {
    tenant_id: agreement.tenant_id,
    tenant: agreement.users_rental_agreements_tenant_idTousers || null,
  });

  if (agreement.tenant_id) {
    try {
      await triggerNotification(
        agreement.tenant_id,
        'user',
        'Eviction Notice (Non-Payment)',
        `Eviction initiated for ${propertyLabel} due to unpaid rent. 
        You have ${graceDays} days to resolve this with your landlord. 
        Grace period ends on ${graceEnd.toDateString()}.`
      );
      console.log(`[Eviction Debug] Notification sent to tenant ${agreement.tenant_id}`);
    } catch (err) {
      console.error('[Eviction Error] Failed to notify tenant:', err);
    }
  }

  // Debug: landlord info
  console.log('[Eviction Debug] Landlord details:', {
    owner_id: agreement.owner_id,
    landlord: agreement.users_rental_agreements_owner_idTousers || null,
  });

  if (agreement.owner_id) {
    try {
      await triggerNotification(
        agreement.owner_id,
        'user',
        'Eviction Initiated',
        `You initiated an eviction for ${propertyLabel}.`
      );
      console.log(`[Eviction Debug] Notification sent to landlord ${agreement.owner_id}`);
    } catch (err) {
      console.error('[Eviction Error] Failed to notify landlord:', err);
    }
  }

  return evictionLog;
};

export const cancelEviction = async ({ evictionId, userRole, reason }) => {
  const eviction = await prisma.eviction_logs.findUnique({
    where: { id: evictionId },
    include: {
      agreement: {
        include: {
          users_rental_agreements_tenant_idTousers: true,  // tenant
          users_rental_agreements_owner_idTousers: true,   // landlord
        },
      },
    },
  });

  if (!eviction) throw new NotFoundError('Eviction record not found');

  if (userRole !== 'landlord' && userRole !== 'admin') {
    throw new ForbiddenError('Only landlord or admin can cancel eviction');
  }

  if (eviction.status === "evicted") {
    throw new ForbiddenError('Eviction already finalized. Cannot cancel.');
  }

  const updatedEviction = await prisma.eviction_logs.update({
    where: { id: evictionId },
    data: {
      status: "cancelled",
      updated_at: new Date(),
      reason: reason || eviction.reason,
    },
  });

  // ✅ Notify tenant
  if (eviction.agreement?.users_rental_agreements_tenant_idTousers?.id) {
    void triggerNotification(
      eviction.agreement.users_rental_agreements_tenant_idTousers.id,
      'user',
      'Eviction Cancelled',
      'Your eviction has been cancelled by the landlord/admin.'
    );
  }

  // ✅ Notify landlord
  if (eviction.agreement?.users_rental_agreements_owner_idTousers?.id) {
    void triggerNotification(
      eviction.agreement.users_rental_agreements_owner_idTousers.id,
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
        include: {
          users_rental_agreements_tenant_idTousers: true,   // tenant
          users_rental_agreements_owner_idTousers: true,    // landlord
          properties: true,                                 // property
          property_units: true,                             // unit
        },
      },
    },
  });

  if (!eviction) throw new NotFoundError('Eviction record not found');

  if (userRole !== 'landlord' && userRole !== 'admin') {
    throw new ForbiddenError('Only landlord or admin can confirm eviction');
  }

  if (eviction.status === "evicted") {
    throw new ForbiddenError('Eviction already confirmed');
  }

  if (eviction.status === "cancelled") {
    throw new ForbiddenError('Cancelled eviction cannot be confirmed');
  }

  return finalizeEvictionAndTerminateAgreement({ eviction, isAuto: false });
};


export default {
    initiateEviction,
    cancelEviction,
    confirmEviction, 
};
  
