import prisma from '../../prisma-client.js';
import { triggerNotification } from '../notifications/notification.service.js';

export const initiateOwnerRequirementTermination = async ({
  agreement,
  initiatedBy,
  description,
  graceDays,
}) => {
  const now = new Date();
  const grace = graceDays && graceDays > 0 ? graceDays : 7;

  checkRefundsOrThrow(agreement);

  // 2️⃣ Update rental agreement with termination metadata
  await prisma.rental_agreements.update({
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

  // 3️⃣ Create eviction log entry to track grace period
  const gracePeriodEnd = new Date(now.getTime() + grace * 24 * 60 * 60 * 1000);
  await prisma.eviction_logs.create({
    data: {
      agreement_id: agreement.id,
      reason: 'OWNER_REQUIREMENT',
      status: 'warning',
      warning_sent_at: now,
      grace_period_end: gracePeriodEnd,
    },
  });

  // 4️⃣ Notify Tenant & Landlord
  if (agreement.tenant?.id) {
    void triggerNotification(
      agreement.tenant.id,
      'user',
      'Termination Initiated: Owner Requirement',
      `Your landlord has initiated termination for owner requirement. You have ${grace} days to vacate the property.`
    );
  }

  if (agreement.landlord?.id) {
    void triggerNotification(
      agreement.landlord.id,
      'user',
      'Termination Initiated: Owner Requirement',
      `You initiated a termination for owner requirement. Tenant has ${grace} days to vacate.`
    );
  }

  return {
    success: true,
    message: `Owner requirement termination initiated. Grace period: ${grace} days.`,
    gracePeriod: grace,
  };
};
