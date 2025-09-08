import prisma from '../../prisma-client.js';
import { checkRefundsOrThrow } from './check-refund.helper..js';
import { ForbiddenError, } from '../../common/services/errors-builder.service.js';
import { triggerNotification } from '../notifications/notification.service.js';

// ✅ initiateMutualTermination
export const initateMutualTermination = async ({
    agreement,
    userId,
    userRole,
    description,
    graceDays,
  }) => {
    if (!['landlord', 'tenant'].includes(userRole)) {
      throw new ForbiddenError('Only landlord or tenant can initiate mutual termination');
    }
  
    const now = new Date();
    const grace = graceDays && graceDays > 0 ? graceDays : 7;
  
    // 1️⃣ Update agreement acceptance flag
    await prisma.rental_agreements.update({
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
  
    // 2️⃣ Reload to check if both accepted
    const updatedAgreement = await prisma.rental_agreements.findUnique({
      where: { id: agreement.id },
      include: { tenant: true, landlord: true, unit: true, properties: true, rent_payments: true },
    });
  
    if (updatedAgreement.landlord_accepted_termination && updatedAgreement.tenant_accepted_termination) {
      // 🔍 Ensure no refundable amounts pending
      checkRefundsOrThrow(updatedAgreement);
  
      // 3️⃣ Create eviction log entry (only if not exists)
      const existingLog = await prisma.eviction_logs.findFirst({
        where: { agreement_id: updatedAgreement.id, reason: 'MUTUAL_AGREEMENT' },
      });
  
      if (!existingLog) {
        const gracePeriodEnd = new Date(now.getTime() + grace * 24 * 60 * 60 * 1000);
        await prisma.eviction_logs.create({
          data: {
            agreement_id: updatedAgreement.id,
            reason: 'MUTUAL_AGREEMENT',
            status: 'warning',
            warning_sent_at: now,
            grace_period_end: gracePeriodEnd,
          },
        });
      }
  
      // 4️⃣ Notify both parties
      if (updatedAgreement.tenant?.id) {
        void triggerNotification(
          updatedAgreement.tenant.id,
          'user',
          'Mutual Termination Accepted',
          `Both you and your landlord accepted termination. You have ${grace} days to vacate the property.`
        );
      }
      if (updatedAgreement.landlord?.id) {
        void triggerNotification(
          updatedAgreement.landlord.id,
          'user',
          'Mutual Termination Accepted',
          `Both you and your tenant accepted termination. The tenant has ${grace} days to vacate.`
        );
      }
  
      return {
        success: true,
        message: `Mutual termination accepted. Grace period: ${grace} days.`,
        gracePeriod: grace,
      };
    }
  
    // 3️⃣ Notify the other party to accept
    if (userRole === 'landlord' && updatedAgreement.tenant?.id) {
      void triggerNotification(
        updatedAgreement.tenant.id,
        'user',
        'Mutual Termination Requested',
        'Your landlord has requested to mutually terminate the agreement. Please review and accept if you agree.'
      );
    }
    if (userRole === 'tenant' && updatedAgreement.landlord?.id) {
      void triggerNotification(
        updatedAgreement.landlord.id,
        'user',
        'Mutual Termination Requested',
        'Your tenant has requested to mutually terminate the agreement. Please review and accept if you agree.'
      );
    }
  
    return {
      success: true,
      message: 'Mutual termination request sent. Awaiting acceptance from the other party.',
    };
};

// ✅ acceptMutualTermination
export const acceptMutualTermination = async ({ agreement, userId, userRole, graceDays }) => {
    if (!['landlord', 'tenant'].includes(userRole)) {
      throw new ForbiddenError('Only landlord or tenant can accept mutual termination');
    }
  
    const now = new Date();
    const grace = graceDays && graceDays > 0 ? graceDays : 7;
  
    // 1️⃣ Update acceptance flag
    await prisma.rental_agreements.update({
      where: { id: agreement.id },
      data: {
        landlord_accepted_termination:
          userRole === 'landlord' ? true : agreement.landlord_accepted_termination,
        tenant_accepted_termination:
          userRole === 'tenant' ? true : agreement.tenant_accepted_termination,
        updated_at: now,
      },
    });
  
    // 2️⃣ Reload to check if both accepted
    const updatedAgreement = await prisma.rental_agreements.findUnique({
      where: { id: agreement.id },
      include: { tenant: true, landlord: true, unit: true, properties: true, rent_payments: true },
    });
  
    if (updatedAgreement.landlord_accepted_termination && updatedAgreement.tenant_accepted_termination) {
      // 🔍 Ensure no refundable amounts pending
      checkRefundsOrThrow(updatedAgreement);
  
      // 3️⃣ Create eviction log entry (only if not exists)
      const existingLog = await prisma.eviction_logs.findFirst({
        where: { agreement_id: updatedAgreement.id, reason: 'MUTUAL_AGREEMENT' },
      });
  
      if (!existingLog) {
        const gracePeriodEnd = new Date(now.getTime() + grace * 24 * 60 * 60 * 1000);
        await prisma.eviction_logs.create({
          data: {
            agreement_id: updatedAgreement.id,
            reason: 'MUTUAL_AGREEMENT',
            status: 'warning',
            warning_sent_at: now,
            grace_period_end: gracePeriodEnd,
          },
        });
      }
  
      // 4️⃣ Notify both parties
      if (updatedAgreement.tenant?.id) {
        void triggerNotification(
          updatedAgreement.tenant.id,
          'user',
          'Mutual Termination Accepted',
          `Both you and your landlord accepted termination. You have ${grace} days to vacate the property.`
        );
      }
      if (updatedAgreement.landlord?.id) {
        void triggerNotification(
          updatedAgreement.landlord.id,
          'user',
          'Mutual Termination Accepted',
          `Both you and your tenant accepted termination. The tenant has ${grace} days to vacate.`
        );
      }
  
      return {
        success: true,
        message: `Mutual termination accepted by both parties. Grace period: ${grace} days.`,
        gracePeriod: grace,
      };
    }
  
    // 3️⃣ Notify the other party still pending
    if (userRole === 'landlord' && updatedAgreement.tenant?.id) {
      void triggerNotification(
        updatedAgreement.tenant.id,
        'user',
        'Mutual Termination Pending',
        'Your landlord has now accepted the mutual termination. Please confirm to proceed.'
      );
    }
    if (userRole === 'tenant' && updatedAgreement.landlord?.id) {
      void triggerNotification(
        updatedAgreement.landlord.id,
        'user',
        'Mutual Termination Pending',
        'Your tenant has now accepted the mutual termination. Please confirm to proceed.'
      );
    }
  
    return {
      success: true,
      message: 'Your acceptance was recorded. Awaiting the other party’s confirmation.',
    };
};
  
export const cancelMutualTermination = async ({ agreement, userId, userRole }) => {

  if (!['landlord', 'tenant'].includes(userRole)) {
    throw new ForbiddenError('Only landlord or tenant can cancel mutual termination');
  }

  const now = new Date();

  // Reset termination metadata
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

  // Notify both
  if (agreement.tenant?.id) {
    void triggerNotification(
      agreement.tenant.id,
      'user',
      'Mutual Termination Cancelled',
      `The mutual termination request has been cancelled by the ${userRole}.`
    );
  }

  if (agreement.landlord?.id) {
    void triggerNotification(
      agreement.landlord.id,
      'user',
      'Mutual Termination Cancelled',
      `The mutual termination request has been cancelled by the ${userRole}.`
    );
  }

  return { success: true, message: 'Mutual termination cancelled successfully' };
};

export default {
  acceptMutualTermination,
  cancelMutualTermination,
  initateMutualTermination,
}