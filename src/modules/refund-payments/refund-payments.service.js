// src/modules/agreement-management-landlord/refund-payments.service.js
import prisma from '../../prisma-client.js';
import { NotFoundError, ForbiddenError } from '../../common/services/errors-builder.service.js';
import { triggerNotification } from '../notifications/notification.service.js';
import { simulateSecurityDepositRefund, simulateAdvanceRentRefund } from '../../common/services/flutterwave.service.js';

export const processSecurityDepositRefund = async ({
    agreementId,
    landlordId,
    action,
    amount,
    reason,
    notes,
  }) => {
    // 1️⃣ Fetch Security Deposit Record (Flutterwave only)
    const deposit = await prisma.security_deposits.findFirst({
      where: {
        rental_agreement_id: agreementId,
        method: 'Flutterwave',
        status: 'held',
        refunded_at: null,
        is_deleted: false,
      },
      include: { rental_agreement: true },
    });
  
    if (!deposit) {
      throw new NotFoundError('No eligible security deposit found for this agreement');
    }
  
    const agreement = deposit.rental_agreement;
    const transactionId = `REFUND_SD_${Date.now()}`;
    const now = new Date();
  
    let refundAmount = 0;
    let forfeitedAmount = 0;
    let finalStatus = 'refunded';
  
    // 2️⃣ Handle Actions
    if (action === 'refund') {
      refundAmount = parseFloat(deposit.amount);
    } else if (action === 'partial_refund') {
      if (!amount || amount >= deposit.amount) {
        throw new ForbiddenError('Partial refund amount must be less than full deposit');
      }
      refundAmount = parseFloat(amount);
      forfeitedAmount = parseFloat(deposit.amount) - refundAmount;
      finalStatus = 'partially_refunded';
    } else if (action === 'forfeit') {
      refundAmount = 0;
      forfeitedAmount = parseFloat(deposit.amount);
      finalStatus = 'forfeited';
    } else {
      throw new ForbiddenError('Invalid security deposit refund action');
    }
  
    // 3️⃣ Create simulated refund payment (only if refundAmount > 0)
    let payment = null;
    if (refundAmount > 0) {
      payment = await simulateSecurityDepositRefund({
        tenantId: agreement.tenant_id,
        propertyId: agreement.property_id,
        amount: refundAmount,
        reason,
      });
    }
  
    // 4️⃣ Update Security Deposit Record
    await prisma.security_deposits.update({
      where: { id: deposit.id },
      data: {
        status: finalStatus,
        refunded_at: now,
        transaction_id: payment ? payment.transaction_id : transactionId,
        notes: notes || `Flutterwave ${action.replace('_', ' ')}`,
      },
    });
  
    // 5️⃣ Notifications
    if (refundAmount > 0) {
      triggerNotification(
        agreement.tenant_id,
        'user',
        'Your security deposit refund is being processed',
        `Amount: ${refundAmount} ${deposit.currency || 'UGX'}`
      );
    }
  
    if (forfeitedAmount > 0) {
      triggerNotification(
        agreement.tenant_id,
        'user',
        'Your security deposit has been forfeited',
        `Amount forfeited: ${forfeitedAmount} ${deposit.currency || 'UGX'}`
      );
    }
  
    triggerNotification(
      agreement.owner_id,
      'user',
      `Deposit action processed for tenant ${agreement.tenant_id}`,
      `Action: ${action}, Refunded: ${refundAmount}, Forfeited: ${forfeitedAmount}`
    );
  
    // 6️⃣ Return Response
    return {
      rental_agreement_id: agreementId,
      tenant_id: agreement.tenant_id,
      action,
      amount_refunded: refundAmount,
      amount_forfeited: forfeitedAmount,
      currency: deposit.currency || 'UGX',
      transaction_id: payment ? payment.transaction_id : transactionId,
      processed_at: now,
      method: 'Flutterwave',
      status: finalStatus,
    };
};
  
export const processAdvanceRentRefund = async ({ agreementId, landlordId, reason, notes }) => {
  const agreement = await prisma.rental_agreements.findFirst({
    where: { id: agreementId, is_deleted: false },
    include: { rent_payments: true },
  });

  if (!agreement) throw new NotFoundError('Agreement not found');

  const advancePayments = agreement.rent_payments.filter(
    (p) => ['completed', 'partial'].includes(p.status) && p.due_date > new Date()
  );

  if (advancePayments.length === 0) {
    throw new ForbiddenError('No refundable advance rent payments found');
  }

  const totalAdvance = advancePayments.reduce(
    (acc, p) => acc + parseFloat(p.amount_paid || 0),
    0
  );

  // Create simulated refund payment
  const payment = await simulateAdvanceRentRefund({
    tenantId: agreement.tenant_id,
    agreementId,
    amount: totalAdvance,
    reason
  });

  // Mark payments as refunded
  await prisma.rent_payments.updateMany({
    where: { id: { in: advancePayments.map((p) => p.id) } },
    data: { status: 'refunded', updated_at: new Date() },
  });

  // Notify parties
  triggerNotification(agreement.tenant_id, 'user', 'Advance rent refund initiated', `Amount: ${totalAdvance} UGX`);
  triggerNotification(agreement.owner_id, 'user', `Advance rent refund issued`, `Amount: ${totalAdvance} UGX`);

  return {
    rental_agreement_id: agreementId,
    tenant_id: agreement.tenant_id,
    amount_refunded: totalAdvance,
    currency: 'UGX',
    transaction_id: payment.transaction_id,
    processed_at: payment.created_at,
    method: 'Flutterwave',
    type: 'advance_rent',
    status: payment.status,
  };
};

export default {
  processSecurityDepositRefund,
  processAdvanceRentRefund,
};
