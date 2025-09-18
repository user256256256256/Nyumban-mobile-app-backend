import prisma from '../../prisma-client.js';
import { triggerNotification } from '../notifications/notification.service.js';
import { checkRefundsOrThrow } from './check-refund.helper..js';

export const initiateOwnerRequirementTermination = async ({
  agreement,
  initiatedBy,
  description,
  graceDays,
  
}) => {
  const now = new Date();
  const grace = graceDays && graceDays > 0 ? graceDays : 7;

  console.log('[DEBUG][initiateOwnerRequirementTermination] Starting for agreementId=', agreement.id);

  // 🔍 Check refundable balances
  checkRefundsOrThrow(agreement);
  console.log('[DEBUG][initiateOwnerRequirementTermination] Refund check passed');

  // 1️⃣ Update rental agreement with termination metadata
  const updatedAgreement = await prisma.rental_agreements.update({
    where: { id: agreement.id },
    data: {
      termination_requested_at: now,
      termination_requested_by: initiatedBy,
      termination_role: 'landlord',
      termination_description: description || '',
      termination_reason: 'OWNER_REQUIREMENT',
      updated_at: now,
    },
  });

  console.log('[DEBUG][initiateOwnerRequirementTermination] Agreement updated:', updatedAgreement.id);

  // 2️⃣ Create eviction log entry with grace period
  const gracePeriodEnd = new Date(now.getTime() + grace * 24 * 60 * 60 * 1000);
  const evictionLog = await prisma.eviction_logs.create({
    data: {
      agreement_id: agreement.id,
      reason: 'OWNER_REQUIREMENT',
      status: 'warning',
      warning_sent_at: now,
      grace_period_end: gracePeriodEnd,
      created_at: now,
      updated_at: now,
    },
  });
  console.log('[DEBUG][initiateOwnerRequirementTermination] Eviction log created:', evictionLog.id);

  // 3️⃣ Notify Tenant
  if (agreement?.users_rental_agreements_tenant_idTousers?.id) {
    void triggerNotification(
      agreement.users_rental_agreements_tenant_idTousers.id,
      'user',
      'Termination Initiated: Owner Requirement',
      `Your landlord has initiated termination for owner requirement. You have ${grace} days to vacate the property.`
    );
    console.log('[DEBUG][initiateOwnerRequirementTermination] Tenant notified:', agreement.users_rental_agreements_tenant_idTousers.id);
  }

  // 4️⃣ Notify Landlord
  if (agreement?.users_rental_agreements_owner_idTousers?.id) {
    void triggerNotification(
      agreement.users_rental_agreements_owner_idTousers.id,
      'user',
      'Termination Initiated: Owner Requirement',
      `You initiated a termination for owner requirement. Tenant has ${grace} days to vacate.`
    );
    console.log('[DEBUG][initiateOwnerRequirementTermination] Landlord notified:', agreement.users_rental_agreements_owner_idTousers.id);
  }

  // 5️⃣ Return structured response
  return {
    success: true,
    message: `Owner requirement termination initiated. Grace period: ${grace} days.`,
    gracePeriod: grace,
    agreementId: agreement.id,
    evictionLogId: evictionLog.id,
  };
};

export const cancelOwnerRequirementTermination = async ({ agreementId, landlordId }) => {
  console.log(`[DEBUG] Cancel owner requirement termination called for agreementId=${agreementId}, landlordId=${landlordId}`);

  // Fetch agreement
  const agreement = await prisma.rental_agreements.findUnique({
    where: { id: agreementId },
    include: {
      users_rental_agreements_tenant_idTousers: true,
      users_rental_agreements_owner_idTousers: true,
    },
  });

  if (!agreement) throw new NotFoundError('Agreement not found');
  if (agreement.owner_id !== landlordId) throw new ForbiddenError('Only the landlord can cancel this termination');

  // Find the latest eviction log with owner requirement reason
  const evictionLog = await prisma.eviction_logs.findFirst({
    where: { agreement_id: agreement.id, reason: 'OWNER_REQUIREMENT', status: 'warning' },
    orderBy: { created_at: 'desc' },
  });

  if (!evictionLog) throw new NotFoundError('No active owner requirement termination found');

  // Update eviction log
  await prisma.eviction_logs.update({
    where: { id: evictionLog.id },
    data: { status: 'cancelled', updated_at: new Date() },
  });

  console.log(`[DEBUG] Eviction log ${evictionLog.id} cancelled`);

  // Notify tenant and landlord
  if (agreement.users_rental_agreements_tenant_idTousers?.id) {
    void triggerNotification(
      agreement.users_rental_agreements_tenant_idTousers.id,
      'user',
      'Termination Cancelled',
      `Your landlord has cancelled the owner requirement termination. You no longer need to vacate.`
    );
  }

  if (agreement.users_rental_agreements_owner_idTousers?.id) {
    void triggerNotification(
      agreement.users_rental_agreements_owner_idTousers.id,
      'user',
      'Termination Cancelled',
      `You have successfully cancelled the owner requirement termination for agreement ${agreement.id}.`
    );
  }

  return {
    success: true,
    message: 'Owner requirement termination cancelled successfully',
    agreementId: agreement.id,
    evictionLogId: evictionLog.id,
  };
};

export default {
  cancelOwnerRequirementTermination,
}