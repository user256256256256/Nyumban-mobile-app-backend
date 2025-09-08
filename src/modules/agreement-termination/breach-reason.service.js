import prisma from '../../prisma-client.js';
import { triggerNotification } from '../notifications/notification.service.js';
import { finalizeRentalAgreementTermination } from './terminate-helper.js';
import { NotFoundError, ForbiddenError } from '../../common/services/errors-builder.service.js';

export const intiateBreachTermination = async ({
    agreement,
    userId,
    reason,
    description,
    filePath,
  }) => {
    if (!filePath) {
      throw new ForbiddenError('Proof file is required to initiate breach termination.');
    }
  
    const now = new Date();
  
    // 1️⃣ Update rental agreement with termination request metadata
    await prisma.rental_agreements.update({
      where: { id: agreement.id },
      data: {
        termination_requested_at: now,
        termination_requested_by: userId,
        termination_role: 'landlord',
        termination_description: description || '',
      },
    });
  
    // 2️⃣ Create a breach log with status = pending_admin_review
    const breachLog = await prisma.agreement_breach_logs.create({
      data: {
        agreement_id: agreement.id,
        reason,
        description,
        file_path: filePath,
        status: 'pending_remedy',
        warning_sent_at: now,
        created_at: now,
        updated_at: now,
      },
    });
  
    // 3️⃣ Notify Tenant & Landlord
    if (agreement.tenant?.id) {
      void triggerNotification(
        agreement.tenant.id,
        'user',
        'Breach Termination Initiated',
        `A termination has been initiated for reason "${reason}". Admin will review the case.`
      );
    }
  
    if (agreement.landlord?.id) {
      void triggerNotification(
        agreement.landlord.id,
        'user',
        'Breach Termination Initiated',
        `You initiated a termination for reason "${reason}". Admin will review the case.`
      );
    }
  
    return breachLog;
};

/**
 * This function should be called by the admin after review
 * @param breachLogId - the breach log record to process
 * @param outcome - enum: warning | pending_remedy | resolved | eviction_recommended
 * @param remedyDeadline - optional if outcome = pending_remedy
 */
export const processBreachAdminOutcome = async ({ breachLogId, outcome, remedyDeadline }) => {
    const breachLog = await prisma.agreement_breach_logs.findUnique({
      where: { id: breachLogId },
      include: {
        rental_agreement: {
          include: { tenant: true, landlord: true, property: true, unit: true },
        },
      },
    });
  
    if (!breachLog) throw new NotFoundError('Breach log not found');
    const agreement = breachLog.rental_agreement;
  
    // Update breach log status & optional remedy deadline
    await prisma.agreement_breach_logs.update({
      where: { id: breachLogId },
      data: {
        status: outcome,
        remedy_deadline: outcome === breach_status.pending_remedy ? remedyDeadline : null,
        updated_at: new Date(),
      },
    });
  
    // Notify tenant and landlord
    if (agreement.tenant?.id) {
      void triggerNotification(
        agreement.tenant.id,
        'user',
        `Breach Review Outcome: ${outcome}`,
        `Admin reviewed your agreement for breach reason "${breachLog.reason}". Outcome: ${outcome}.`
      );
    }
    if (agreement.landlord?.id) {
      void triggerNotification(
        agreement.landlord.id,
        'user',
        `Breach Review Outcome: ${outcome}`,
        `Admin reviewed the breach termination you initiated. Outcome: ${outcome}.`
      );
    }
  
    // Only set a flag if eviction is recommended — landlord must confirm
    if (outcome === breach_status.eviction_recommended) {
      await prisma.rental_agreements.update({
        where: { id: agreement.id },
        data: {
          did_admin_approve_breach: true,
        },
      });
  
      // Notify landlord they can now confirm the termination
      if (agreement.landlord?.id) {
        void triggerNotification(
          agreement.landlord.id,
          'user',
          'Breach Termination Approval',
          'Admin has approved the breach termination. You can now confirm and finalize eviction.'
        );
      }
    }
  
    return breachLog;
};

export const confirmBreachEviction = async ({ agreementId, landlordId }) => {
  const agreement = await prisma.rental_agreements.findUnique({
    where: { id: agreementId },
    include: { tenant: true, landlord: true, unit: true, rent_payments: true, properties: true },
  });

  if (!agreement) throw new NotFoundError('Agreement not found');
  if (!agreement.did_admin_approve_breach) throw new ForbiddenError('Admin has not approved this breach termination');
  if (agreement.status === 'terminated') throw new ForbiddenError('Agreement already terminated');
  if (agreement.owner_id !== landlordId) throw new ForbiddenError('Only the landlord can confirm breach eviction');

  // 🔍 Check refunds
  checkRefundsOrThrow(agreement);

  // Finalize termination
  await finalizeRentalAgreementTermination({ agreement, timestamp: new Date(), notify: true });

  return { success: true, message: 'Breach termination finalized', agreementId: agreement.id };
};

export default {
  processBreachAdminOutcome,
  confirmBreachEviction,
}