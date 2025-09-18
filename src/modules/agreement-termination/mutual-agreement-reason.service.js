import prisma from '../../prisma-client.js';
import { ForbiddenError, NotFoundError } from '../../common/services/errors-builder.service.js';
import { triggerNotification } from '../notifications/notification.service.js';
import { checkRefundsOrThrow } from './check-refund.helper..js';
import { finalizeRentalAgreementTermination } from './terminate-helper.js';

/**
 * Initiate mutual termination (marks request + sets initiator's acceptance).
 * Does NOT set a grace period until both parties have accepted.
 */
export const initiateMutualTermination = async ({
  agreement,
  userId,
  userRole,
  description,
  graceDays, // optional — will only be used if both accept immediately
}) => {
  console.log('[DEBUG][initiateMutualTermination] called:', { agreementId: agreement?.id, userId, userRole, graceDays });

  const now = new Date();

  // mark request + set the initiating party's accepted flag
  const updated = await prisma.rental_agreements.update({
    where: { id: agreement.id },
    data: {
      
      termination_requested_at: now,
      termination_requested_by: userId,
      termination_role: userRole,
      termination_description: description || '',
      termination_reason: 'MUTUAL_AGREEMENT',
      landlord_accepted_termination: userRole === 'landlord' ? true : agreement.landlord_accepted_termination,
      tenant_accepted_termination: userRole === 'tenant' ? true : agreement.tenant_accepted_termination,
      updated_at: now,
    },
  });

  // reload with relations we need
  const updatedAgreement = await prisma.rental_agreements.findUnique({
    where: { id: updated.id },
    include: {
      users_rental_agreements_tenant_idTousers: true,
      users_rental_agreements_owner_idTousers: true,
      properties: true,
      property_units: true,
      rent_payments: true,
    },
  });

  console.log('[DEBUG][initiateMutualTermination] Updated agreement flags:', {
    landlordAccepted: updatedAgreement.landlord_accepted_termination,
    tenantAccepted: updatedAgreement.tenant_accepted_termination,
  });

    // ensure refundable amounts cleared
    checkRefundsOrThrow(updatedAgreement);

  // If both accepted -> either create grace eviction or finalize immediately
  if (updatedAgreement.landlord_accepted_termination && updatedAgreement.tenant_accepted_termination) {
    console.log('[DEBUG][initiateMutualTermination] Both parties accepted — proceeding to finalize or schedule according to graceDays');

    const grace = typeof graceDays === 'number' && graceDays > 0 ? graceDays : 0;
    if (grace > 0) {
      const gracePeriodEnd = new Date(now.getTime() + grace * 24 * 60 * 60 * 1000);
      const evictionLog = await prisma.eviction_logs.create({
        data: {
          agreement_id: updatedAgreement.id,
          reason: 'MUTUAL_AGREEMENT',
          status: 'warning',
          warning_sent_at: now,
          grace_period_end: gracePeriodEnd,
          created_at: now,
          updated_at: now,
        },
      });

      // Notify both parties
      const label = `${updatedAgreement.properties?.property_name || 'Property'}${updatedAgreement.property_units?.unit_number ? ` - Unit ${updatedAgreement.property_units.unit_number}` : ''}`;
      if (updatedAgreement.users_rental_agreements_tenant_idTousers?.id) {
        void triggerNotification(
          updatedAgreement.users_rental_agreements_tenant_idTousers.id,
          'user',
          'Mutual Termination Accepted',
          `Both parties agreed to terminate. You have ${grace} day(s) to vacate ${label}.`
        );
      }
      if (updatedAgreement.users_rental_agreements_owner_idTousers?.id) {
        void triggerNotification(
          updatedAgreement.users_rental_agreements_owner_idTousers.id,
          'user',
          'Mutual Termination Accepted',
          `Both parties agreed to terminate. Tenant has ${grace} day(s) to vacate ${label}.`
        );
      }

      console.log('[DEBUG][initiateMutualTermination] Grace eviction created:', evictionLog.id);
      return {
        success: true,
        message: `Mutual termination accepted. Grace period: ${grace} days.`,
        gracePeriod: grace,
        agreementId: updatedAgreement.id,
        evictionLogId: evictionLog.id,
      };
    }

    // grace === 0 -> finalize immediately
    console.log('[DEBUG][initiateMutualTermination] No grace days requested -> finalizing immediately');
    // Optional: create an eviction log with status 'evicted' for audit
    const immediateLog = await prisma.eviction_logs.create({
      data: {
        agreement_id: updatedAgreement.id,
        reason: 'MUTUAL_AGREEMENT',
        status: 'evicted',
        warning_sent_at: now,
        grace_period_end: now,
        created_at: now,
        updated_at: now,
      },
    });

    await finalizeRentalAgreementTermination({ agreement: updatedAgreement, timestamp: now, notify: true });

    console.log('[DEBUG][initiateMutualTermination] Finalization complete for agreement:', updatedAgreement.id);
    return {
      success: true,
      message: 'Mutual termination accepted by both parties and finalized immediately.',
      agreementId: updatedAgreement.id,
      evictionLogId: immediateLog.id,
    };
  }

  // Not both accepted yet — notify other party
  if (userRole === 'landlord' && updatedAgreement.users_rental_agreements_tenant_idTousers?.id) {
    void triggerNotification(
      updatedAgreement.users_rental_agreements_tenant_idTousers.id,
      'user',
      'Mutual Termination Requested',
      'Your landlord has requested a mutual termination. Please review and accept if you agree.'
    );
  } else if (userRole === 'tenant' && updatedAgreement.users_rental_agreements_owner_idTousers?.id) {
    void triggerNotification(
      updatedAgreement.users_rental_agreements_owner_idTousers.id,
      'user',
      'Mutual Termination Requested',
      'Your tenant has requested a mutual termination. Please review and accept if you agree.'
    );
  }

  return {
    success: true,
    message: 'Mutual termination request sent. Awaiting acceptance from the other party.',
    agreementId: updatedAgreement.id,
  };
};

/**
 * Accept mutual termination (sets the accept flag for caller). If both flags become true,
 * will either create a grace eviction or finalize immediately (graceDays optional).
 *
 * Expected signature: { agreement, userId, userRole, graceDays }
 */
export const acceptMutualTermination = async ({ agreement, userId, userRole, graceDays }) => {
  console.log('[DEBUG][acceptMutualTermination] called:', { agreementId: agreement?.id, userId, userRole, graceDays });

  if (!['landlord', 'tenant'].includes(userRole)) {
    throw new ForbiddenError('Only landlord or tenant can accept mutual termination');
  }

  const now = new Date();

  // set acceptance flag for caller
  await prisma.rental_agreements.update({
    where: { id: agreement.id },
    data: {
      landlord_accepted_termination: userRole === 'landlord' ? true : agreement.landlord_accepted_termination,
      tenant_accepted_termination: userRole === 'tenant' ? true : agreement.tenant_accepted_termination,
      updated_at: now,
    },
  });

  // reload with relations
  const updatedAgreement = await prisma.rental_agreements.findUnique({
    where: { id: agreement.id },
    include: {
      users_rental_agreements_tenant_idTousers: true,
      users_rental_agreements_owner_idTousers: true,
      properties: true,
      property_units: true,
      rent_payments: true,
    },
  });

  console.log('[DEBUG][acceptMutualTermination] flags after update:', {
    landlordAccepted: updatedAgreement.landlord_accepted_termination,
    tenantAccepted: updatedAgreement.tenant_accepted_termination,
  });

  // If both accepted => same behavior as above
  if (updatedAgreement.landlord_accepted_termination && updatedAgreement.tenant_accepted_termination) {
    console.log('[DEBUG][acceptMutualTermination] Both parties accepted — proceeding');

    // ensure refundable amounts cleared
    checkRefundsOrThrow(updatedAgreement);

    const grace = typeof graceDays === 'number' && graceDays > 0 ? graceDays : 0;
    if (grace > 0) {
      const gracePeriodEnd = new Date(now.getTime() + grace * 24 * 60 * 60 * 1000);
      const evictionLog = await prisma.eviction_logs.create({
        data: {
          agreement_id: updatedAgreement.id,
          reason: 'MUTUAL_AGREEMENT',
          status: 'warning',
          warning_sent_at: now,
          grace_period_end: gracePeriodEnd,
          created_at: now,
          updated_at: now,
        },
      });

      if (updatedAgreement.users_rental_agreements_tenant_idTousers?.id) {
        void triggerNotification(
          updatedAgreement.users_rental_agreements_tenant_idTousers.id,
          'user',
          'Mutual Termination Accepted',
          `Both parties accepted mutual termination. You have ${grace} day(s) to vacate.`
        );
      }
      if (updatedAgreement.users_rental_agreements_owner_idTousers?.id) {
        void triggerNotification(
          updatedAgreement.users_rental_agreements_owner_idTousers.id,
          'user',
          'Mutual Termination Accepted',
          `Mutual termination accepted. Tenant has ${grace} day(s) to vacate.`
        );
      }

      console.log('[DEBUG][acceptMutualTermination] Grace eviction created:', evictionLog.id);
      return {
        success: true,
        message: `Mutual termination accepted by both parties. Grace period: ${grace} days.`,
        gracePeriod: grace,
        agreementId: updatedAgreement.id,
        evictionLogId: evictionLog.id,
      };
    }

    // finalize immediately
    const immediateLog = await prisma.eviction_logs.create({
      data: {
        agreement_id: updatedAgreement.id,
        reason: 'MUTUAL_AGREEMENT',
        status: 'evicted',
        warning_sent_at: now,
        grace_period_end: now,
        created_at: now,
        updated_at: now,
      },
    });

    await finalizeRentalAgreementTermination({ agreement: updatedAgreement, timestamp: now, notify: true });

    console.log('[DEBUG][acceptMutualTermination] Finalized immediately for agreement:', updatedAgreement.id);
    return {
      success: true,
      message: 'Mutual termination accepted by both parties and finalized immediately.',
      agreementId: updatedAgreement.id,
      evictionLogId: immediateLog.id,
    };
  }

  // otherwise, notify the other party to accept
  if (userRole === 'landlord' && updatedAgreement.users_rental_agreements_tenant_idTousers?.id) {
    void triggerNotification(
      updatedAgreement.users_rental_agreements_tenant_idTousers.id,
      'user',
      'Mutual Termination Pending',
      'Your landlord has accepted the mutual termination. Please confirm to proceed.'
    );
  } else if (userRole === 'tenant' && updatedAgreement.users_rental_agreements_owner_idTousers?.id) {
    void triggerNotification(
      updatedAgreement.users_rental_agreements_owner_idTousers.id,
      'user',
      'Mutual Termination Pending',
      'Your tenant has accepted the mutual termination. Please confirm to proceed.'
    );
  }

  return {
    success: true,
    message: 'Your acceptance was recorded. Awaiting the other party’s confirmation.',
    agreementId: updatedAgreement.id,
  };
};

/**
 * Cancel mutual termination request (either side).
 * Signature: { agreement, userId, userRole }
 */
export const cancelMutualTermination = async ({ agreement, userId, userRole }) => {
  console.log('[DEBUG][cancelMutualTermination] called:', { agreementId: agreement?.id, userId, userRole });

  if (!['landlord', 'tenant'].includes(userRole)) {
    throw new ForbiddenError('Only landlord or tenant can cancel mutual termination');
  }

  const now = new Date();

  // Reset termination metadata and flags
  await prisma.rental_agreements.update({
    where: { id: agreement.id },
    data: {
      termination_reason: null,
      termination_description: null,
      termination_requested_by: null,
      termination_role: null,
      termination_requested_at: null,
      landlord_accepted_termination: false,
      tenant_accepted_termination: false,
      updated_at: now,
    },
  });

  // Notify both parties (use relation-safe IDs)
  const reloaded = await prisma.rental_agreements.findUnique({
    where: { id: agreement.id },
    include: {
      users_rental_agreements_tenant_idTousers: true,
      users_rental_agreements_owner_idTousers: true,
    },
  });

  if (reloaded.users_rental_agreements_tenant_idTousers?.id) {
    void triggerNotification(
      reloaded.users_rental_agreements_tenant_idTousers.id,
      'user',
      'Mutual Termination Cancelled',
      `The mutual termination request has been cancelled by the ${userRole}.`
    );
  }

  if (reloaded.users_rental_agreements_owner_idTousers?.id) {
    void triggerNotification(
      reloaded.users_rental_agreements_owner_idTousers.id,
      'user',
      'Mutual Termination Cancelled',
      `The mutual termination request has been cancelled by the ${userRole}.`
    );
  }

  console.log('[DEBUG][cancelMutualTermination] cancelled for agreement:', agreement.id);
  return { success: true, message: 'Mutual termination cancelled successfully', agreementId: agreement.id };
};

export default {
  cancelMutualTermination,
  acceptMutualTermination,
}