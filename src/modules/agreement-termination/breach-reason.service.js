import prisma from '../../prisma-client.js';
import { triggerNotification } from '../notifications/notification.service.js';
import { finalizeRentalAgreementTermination } from './terminate-helper.js';
import { NotFoundError, ForbiddenError } from '../../common/services/errors-builder.service.js';
import { checkRefundsOrThrow } from './check-refund.helper..js';

export const intiateBreachTermination = async ({
  agreement,
  userId,
  reason,
  description,
  filePath,
}) => {
  console.log('[DEBUG][intiateBreachTermination] Called with:', {
    agreementId: agreement?.id,
    userId,
    reason,
    description,
    filePath,
  });

  if (!filePath) {
    console.error('[ERROR][intiateBreachTermination] No proof file provided');
    throw new ForbiddenError('Proof file is required to initiate breach termination.');
  }

  const now = new Date();
  console.log('[DEBUG][intiateBreachTermination] Current timestamp:', now);

  // 1️⃣ Update rental agreement with termination request metadata
  const updatedAgreement = await prisma.rental_agreements.update({
    where: { id: agreement.id },
    data: {
      termination_requested_at: now,
      termination_requested_by: userId,
      termination_role: 'landlord',
      termination_description: description || '',
    },
  });
  console.log('[DEBUG][intiateBreachTermination] Rental agreement updated:', updatedAgreement.id);

  // 2️⃣ Create a breach log with status = pending_admin_review
  const breachLog = await prisma.agreement_breach_logs.create({
    data: {
      agreement_id: agreement.id,
      reason,
      description,
      file_path: filePath,
      status: 'warning',
      warning_sent_at: now,
      created_at: now,
      updated_at: now,
    },
  });
  console.log('[DEBUG][intiateBreachTermination] Breach log created:', breachLog.id);

  // 3️⃣ Notify Tenant & Landlord
  if (agreement.tenant_id) {
    console.log('[DEBUG][intiateBreachTermination] Notifying tenant:', agreement.tenant_id);
    void triggerNotification(
      agreement.tenant_id,
      'user',
      'Breach Termination Initiated',
      `A termination has been initiated for reason "${reason}". Admin will review the case.`
    );
  }

  if (agreement.owner_id) {
    console.log('[DEBUG][intiateBreachTermination] Notifying landlord:', agreement.owner_id);
    void triggerNotification(
      agreement.owner_id,
      'user',
      'Breach Termination Initiated',
      `You initiated a termination for reason "${reason}". Admin will review the case.`
    );
  }

  console.log('[DEBUG][intiateBreachTermination] Completed for breach log ID:', breachLog.id);
  return breachLog;
};

export const processBreachAdminOutcome = async ({ breachLogId, outcome, remedyDays }) => {
  console.log(`[DEBUG] Starting breach admin outcome process for breachLogId=${breachLogId}, outcome=${outcome}, remedyDays=${remedyDays}`);

  // Fetch breach log with valid relations only
  const breachLog = await prisma.agreement_breach_logs.findUnique({
    where: { id: breachLogId },
    include: {
      rental_agreement: {
        include: {
          users_rental_agreements_tenant_idTousers: true,
          users_rental_agreements_owner_idTousers: true,
        },
      },
    },
  });

  if (!breachLog) {
    console.error(`[ERROR] Breach log not found for id=${breachLogId}`);
    throw new NotFoundError('Breach log not found');
  }

  const agreement = breachLog.rental_agreement;
  const now = new Date();
  console.log(`[DEBUG] Fetched breach log: ${breachLog.id}, current status: ${breachLog.status}`);

  const updateData = {
    status: outcome,
    updated_at: now,
  };

  // Handle pending_remedy (forgiven)
  if (outcome === "pending_remedy") {
    const calculatedRemedyDeadline = remedyDays
      ? new Date(now.getTime() + remedyDays * 24 * 60 * 60 * 1000)
      : null;

    updateData.remedy_deadline = calculatedRemedyDeadline;
    console.log(`[DEBUG] Setting pending_remedy: remedy_deadline=${calculatedRemedyDeadline}`);
  } else {
    updateData.remedy_deadline = null;
    console.log(`[DEBUG] Not pending_remedy: clearing remedy_deadline`);
  }

  // Handle resolved
  if (outcome === "resolved") {
    console.log(`[DEBUG] Marking breach as resolved for breachLogId=${breachLogId}`);

    // Extra notifications: case closed
    if (agreement?.users_rental_agreements_tenant_idTousers?.id) {
      void triggerNotification(
        agreement.users_rental_agreements_tenant_idTousers.id,
        'user',
        'Breach Issue Resolved',
        `The breach issue "${breachLog.reason}" has been legally settled and marked as resolved.`
      );
    }

    if (agreement?.users_rental_agreements_owner_idTousers?.id) {
      void triggerNotification(
        agreement.users_rental_agreements_owner_idTousers.id,
        'user',
        'Breach Issue Resolved',
        `The breach termination you initiated for "${breachLog.reason}" has been legally settled and marked as resolved.`
      );
    }
  }

  // Update breach log
  const updatedBreachLog = await prisma.agreement_breach_logs.update({
    where: { id: breachLogId },
    data: updateData,
  });
  console.log(`[DEBUG] Updated breach log status to ${outcome}`);

  // Generic notifications for all outcomes (in addition to resolved-specific above)
  if (outcome !== "resolved") {
    // Notify tenant
    if (agreement?.users_rental_agreements_tenant_idTousers?.id) {
      console.log(`[DEBUG] Sending notification to tenant id=${agreement.users_rental_agreements_tenant_idTousers.id}`);
      void triggerNotification(
        agreement.users_rental_agreements_tenant_idTousers.id,
        'user',
        `Breach Review Outcome: ${outcome}`,
        `Admin reviewed your agreement for breach reason "${breachLog.reason}". Outcome: ${outcome}.`
      );
    }

    // Notify landlord
    if (agreement?.users_rental_agreements_owner_idTousers?.id) {
      console.log(`[DEBUG] Sending notification to landlord id=${agreement.users_rental_agreements_owner_idTousers.id}`);
      void triggerNotification(
        agreement.users_rental_agreements_owner_idTousers.id,
        'user',
        `Breach Review Outcome: ${outcome}`,
        `Admin reviewed the breach termination you initiated. Outcome: ${outcome}.`
      );
    }
  }

  // Eviction recommended: set admin flag & notify landlord
  if (outcome === "eviction_recommended") {
    await prisma.rental_agreements.update({
      where: { id: agreement.id },
      data: { did_admin_approve_breach: true },
    });
    console.log(`[DEBUG] Eviction recommended: did_admin_approve_breach set to true for agreement id=${agreement.id}`);

    if (agreement?.users_rental_agreements_owner_idTousers?.id) {
      console.log(`[DEBUG] Notifying landlord to confirm eviction`);
      void triggerNotification(
        agreement.users_rental_agreements_owner_idTousers.id,
        'user',
        'Breach Termination Approval',
        'Admin has approved the breach termination. You can now confirm and finalize eviction.'
      );
    }
  }

  console.log(`[DEBUG] Completed processing breach admin outcome for breachLogId=${breachLogId}`);
  return updatedBreachLog;
};

export const confirmBreachEviction = async ({ agreementId, landlordId }) => {
  console.log(`[DEBUG] Starting eviction confirmation for agreementId=${agreementId}, landlordId=${landlordId}`);

  const agreement = await prisma.rental_agreements.findUnique({
    where: { id: agreementId },
    include: {
      users_rental_agreements_tenant_idTousers: true,
      users_rental_agreements_owner_idTousers: true,
      property_units: true,
      rent_payments: true,
      properties: true,
    },
  });

  if (!agreement) {
    console.error(`[ERROR] Agreement not found for id=${agreementId}`);
    throw new NotFoundError('Agreement not found', { field: 'Agreement ID' });
  }
  console.log(`[DEBUG] Agreement fetched: id=${agreement.id}, status=${agreement.status}, owner_id=${agreement.owner_id}`);

  // Get the latest breach log for this agreement
  const breachLog = await prisma.agreement_breach_logs.findFirst({
    where: { agreement_id: agreement.id },
    orderBy: { created_at: 'desc' },
  });

  if (!breachLog) {
    console.error(`[ERROR] No breach log found for agreementId=${agreement.id}`);
    throw new NotFoundError('Breach log not found', { field: 'Agreement ID' });
  }
  console.log(`[DEBUG] Latest breach log fetched: id=${breachLog.id}, status=${breachLog.status}`);

  if (breachLog.status !== 'eviction_recommended') {
    console.warn(`[WARN] Breach log status is ${breachLog.status}, eviction not recommended`);
    throw new ForbiddenError('Not recommended to evict tenant', { field: 'Breach Log Status' });
  }
  if (!agreement.did_admin_approve_breach) {
    console.warn(`[WARN] Admin has not approved breach termination for agreementId=${agreement.id}`);
    throw new ForbiddenError('Admin has not approved this breach termination');
  }
  if (agreement.status === 'terminated') {
    console.warn(`[WARN] Agreement already terminated: agreementId=${agreement.id}`);
    throw new ForbiddenError('Agreement already terminated');
  }
  if (agreement.owner_id !== landlordId) {
    console.warn(`[WARN] Landlord mismatch: agreement.owner_id=${agreement.owner_id}, provided landlordId=${landlordId}`);
    throw new ForbiddenError('Only the landlord can confirm breach eviction');
  }

  console.log(`[DEBUG] Checking refunds for agreementId=${agreement.id}`);
  // 🔍 Check refunds
  checkRefundsOrThrow(agreement);
  console.log(`[DEBUG] No refundable amounts blocking termination`);

  // ✅ Finalize termination
  console.log(`[DEBUG] Finalizing termination for agreementId=${agreement.id}`);
  await finalizeRentalAgreementTermination({
    agreement,
    timestamp: new Date(),
    notify: true,
  });
  console.log(`[DEBUG] Termination finalized for agreementId=${agreement.id}`);

  return { agreementId: agreement.id, breachLogId: breachLog.id };
};

export const resolveBreachByLandlord = async ({ agreementId, landlordId }) => {
  console.log(`[DEBUG] Landlord resolving breach for agreementId=${agreementId}, landlordId=${landlordId}`);

  const agreement = await prisma.rental_agreements.findUnique({
    where: { id: agreementId },
    include: {
      users_rental_agreements_tenant_idTousers: true,
      users_rental_agreements_owner_idTousers: true,
    },
  });

  if (!agreement) {
    throw new NotFoundError('Agreement not found', { field: 'Agreement ID' });
  }
  if (agreement.owner_id !== landlordId) {
    throw new ForbiddenError('Only the landlord can resolve the breach');
  }

  // Get latest breach log
  const breachLog = await prisma.agreement_breach_logs.findFirst({
    where: { agreement_id: agreement.id },
    orderBy: { created_at: 'desc' },
  });

  if (!breachLog) {
    throw new NotFoundError('Breach log not found', { field: 'Agreement ID' });
  }

  if (['resolved'].includes(breachLog.status)) {
    throw new ForbiddenError('Breach log already resolved or closed');
  }

  const updatedLog = await prisma.agreement_breach_logs.update({
    where: { id: breachLog.id },
    data: {
      status: 'resolved',
      updated_at: new Date(),
    },
  });

  // 🔔 Notifications
  if (agreement.tenant_id) {
    void triggerNotification(
      agreement.tenant_id,
      'user',
      'Breach Issue Resolved by Landlord',
      'Your landlord has resolved the breach issue and chosen not to proceed with eviction.'
    );
  }

  if (agreement.owner_id) {
    void triggerNotification(
      agreement.owner_id,
      'user',
      'Breach Issue Marked Resolved',
      'You have successfully marked the breach issue as resolved.'
    );
  }

  console.log(`[DEBUG] Breach log marked as resolved by landlord id=${landlordId}`);
  return { agreementId: agreement.id, breachLogId: updatedLog.id };
};
                                                           
export default {
  processBreachAdminOutcome,
  confirmBreachEviction,
  resolveBreachByLandlord,
}

/*
pending_remedy – Treated as a forgiven issue:

Sets remedy_deadline and notice_period to track the grace/forgiveness period.

Indicates that the tenant is being monitored, and admin can follow up on behavior.

Tenant and landlord get notifications, but eviction is not triggered. ✅

resolved – Issue legally settled:

No remedy_deadline or notice_period is set.

Closes the breach log cleanly.

Tenant and landlord are notified that the issue is fully resolved. ✅

eviction_recommended – Tenant should be evicted immediately:

Sets did_admin_approve_breach = true on the agreement.

Notifies the landlord that admin has approved the termination.

Requires the landlord to confirm and finalize the eviction. ✅

Conclusion: This behavior models a clear admin workflow:

pending_remedy = “forgive and monitor”

resolved = “closed”

eviction_recommended = “urgent eviction, landlord confirms”

*/