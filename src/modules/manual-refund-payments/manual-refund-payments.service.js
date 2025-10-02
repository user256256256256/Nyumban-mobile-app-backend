import prisma from '../../prisma-client.js';
import { NotFoundError, ForbiddenError } from '../../common/services/errors-builder.service.js';
import { triggerNotification } from '../notifications/notification.service.js';
import { v4 as uuidv4 } from 'uuid';

export const processManualSecurityDepositRefund = async ({
  agreementId,
  landlordId,
  action,
  amount,
  notes,
}) => {
  // 1️⃣ Fetch Security Deposit Record
  const deposit = await prisma.security_deposits.findFirst({
    where: {
      rental_agreement_id: agreementId,
      method: 'Cash',
      status: 'held',
      refunded_at: null,
      is_deleted: false,
    },
    include: { rental_agreement: true },
  });

  if (!deposit) {
    throw new NotFoundError('No eligible cash security deposit found for this agreement');
  }

  const agreement = deposit.rental_agreement;
  const transactionId = `MANUAL-${uuidv4()}`;
  const now = new Date();

  let refundAmount = 0;
  let forfeitedAmount = 0;
  let finalStatus = 'refunded';

  // 2️⃣ Handle Actions
  if (action === 'refund') {
    refundAmount = parseFloat(deposit.amount);
  } else if (action === 'partial_refund') {
    if (amount >= deposit.amount) {
      throw new ForbiddenError('Partial refund amount cannot exceed or equal full deposit');
    }
    refundAmount = parseFloat(amount);
    forfeitedAmount = parseFloat(deposit.amount) - refundAmount;
    finalStatus = 'partially_refunded';
  } else if (action === 'forfeit') {
    refundAmount = 0;
    forfeitedAmount = parseFloat(deposit.amount);
    finalStatus = 'forfeited';
  }

  // 3️⃣ Update Security Deposit Record
  await prisma.security_deposits.update({
    where: { id: deposit.id },
    data: {
      status: finalStatus,
      refunded_at: now,
      transaction_id: transactionId,
      notes: notes || `Manual ${action.replace('_', ' ')} via Cash`,
    },
  });

  // 4️⃣ Notifications
  if (refundAmount > 0) {
    triggerNotification(
      agreement.tenant_id,
      'user',
      'Your security deposit has been refunded in cash',
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
    `Action: ${action}, Amount Refunded: ${refundAmount}, Forfeited: ${forfeitedAmount}`
  );

  // 5️⃣ Return Response
  return {
    rental_agreement_id: agreementId,
    tenant_id: agreement.tenant_id,
    action,
    amount_refunded: refundAmount,
    amount_forfeited: forfeitedAmount,
    currency: deposit.currency || 'UGX',
    transaction_id: transactionId,
    processed_at: now,
    method: 'Cash',
    status: finalStatus,
  };
};

export const processAdvanceRentRefund = async ({ agreementId, landlordId, notes }) => {
  const agreement = await prisma.rental_agreements.findFirst({
    where: { id: agreementId, is_deleted: false },
    include: { rent_payments: true },
  });

  if (!agreement) throw new NotFoundError('Agreement not found');

  // 🔎 Find refundable advance payments (future completed or partial)
  const advancePayments = agreement.rent_payments.filter(
    (p) => ['completed', 'partial'].includes(p.status) && p.due_date > new Date()
  );

  if (advancePayments.length === 0) {
    throw new ForbiddenError('No refundable advance rent payments found');
  }

  // 💰 Calculate total refundable amount using actual paid amounts
  const totalAdvance = advancePayments.reduce(
    (acc, p) => acc + parseFloat(p.amount_paid || 0),
    0
  );

  const transactionId = `ADVANCE_REFUND-${uuidv4()}`;
  const now = new Date();

  // 🏷️ Mark all future advance payments as refunded
  const refundableIds = advancePayments.map((p) => p.id);

  await prisma.rent_payments.updateMany({
    where: {
      id: { in: refundableIds },
      status: { in: ['completed', 'partial'] },
      due_date: { gt: new Date() },
    },
    data: { status: 'refunded', updated_at: now },
  });

  // 🔔 Notifications
  triggerNotification(
    agreement.tenant_id,
    'user',
    'Advance rent refund processed',
    `Amount refunded: ${totalAdvance} UGX`
  );

  triggerNotification(
    agreement.owner_id,
    'user',
    `Advance rent refund issued for tenant ${agreement.tenant_id}`,
    `Amount refunded: ${totalAdvance} UGX`
  );

  return {
    rental_agreement_id: agreementId,
    tenant_id: agreement.tenant_id,
    amount_refunded: totalAdvance,
    currency: 'UGX',
    transaction_id: transactionId,
    processed_at: now,
    method: 'manual',
    type: 'advance_rent',
    status: 'refunded',
  };
};

export default {
  processManualSecurityDepositRefund,
  processAdvanceRentRefund,
};