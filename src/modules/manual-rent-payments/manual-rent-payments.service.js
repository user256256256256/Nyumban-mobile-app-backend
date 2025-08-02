import prisma from '../../prisma-client.js';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

import {
  ValidationError,
  NotFoundError,
  AuthError,
  ForbiddenError,
  ServerError,
} from '../../common/services/errors-builder.service.js';

// Main function to manually record a rent payment
export const markManualPayment = async ({ tenantId, amount, method, notes, landlordId }) => {
  // 1. Fetch all due or overdue rent payments for the tenant
  const duePayments = await prisma.rent_payments.findMany({
    where: {
      tenant_id: tenantId,
      status: { in: ['pending', 'overdued'] },
      is_deleted: false,
    },
    orderBy: { due_date: 'asc' },
  });

  // 2. If no pending payments are found, throw error
  if (!duePayments.length) throw new NotFoundError('No due rent payments found');

  // 3. Retrieve the rental agreement tied to the earliest due payment
  const agreement = await prisma.rental_agreements.findUnique({
    where: { id: duePayments[0].rental_agreement_id },
  });

  // 4. Ensure that the landlord making this request owns the agreement
  if (!agreement || agreement.owner_id !== landlordId) {
    throw new ForbiddenError('Unauthorized: You do not own this agreement', { field: 'Landlord ID' });
  }

  // 5. Determine monthly rent and calculate total outstanding due
  const monthlyRent = parseFloat(duePayments[0].due_amount);
  const totalDue = duePayments.reduce(
    (sum, p) => sum + (parseFloat(p.due_amount) - parseFloat(p.amount_paid || 0)),
    0
  );

  // 6. Identify payment type based on amount
  let paymentType = 'partial';
  let monthsCovered = 0;

  if (amount >= totalDue) {
    paymentType = 'advance';
    monthsCovered = Math.floor(amount / monthlyRent);
  } else if (amount >= monthlyRent) {
    paymentType = 'paid';
    monthsCovered = Math.floor(amount / monthlyRent);
  }

  const now = new Date();
  let remaining = amount;

  // 7. Apply payment to existing due payments
  for (const p of duePayments) {
    const balance = parseFloat(p.due_amount) - parseFloat(p.amount_paid || 0);
    if (remaining <= 0) break;

    const payNow = Math.min(remaining, balance);

    await prisma.rent_payments.update({
      where: { id: p.id },
      data: {
        amount_paid: parseFloat(p.amount_paid || 0) + payNow,
        status: payNow + parseFloat(p.amount_paid || 0) >= parseFloat(p.due_amount)
          ? 'completed'
          : 'partially_paid',
        method,
        payment_date: now,
        transaction_id: `MANUAL-${uuidv4()}`,
        notes,
        updated_at: now,
      },
    });

    remaining -= payNow;
  }

  // 8. If any amount is left, record it as advance payment for future months
  let lastDue = duePayments[duePayments.length - 1].due_date;
  let nextDueDate = dayjs(lastDue).add(1, 'month');

  while (remaining >= monthlyRent) {
    await prisma.rent_payments.create({
      data: {
        id: uuidv4(),
        rental_agreement_id: agreement.id,
        tenant_id: tenantId,
        property_id: agreement.property_id,
        unit_id: agreement.unit_id,
        due_date: nextDueDate.toDate(),
        due_amount: monthlyRent,
        amount_paid: monthlyRent,
        method,
        payment_date: now,
        transaction_id: `MANUAL-${uuidv4()}`,
        period_covered: generatePeriodCovered(nextDueDate),
        status: 'completed',
        notes,
        is_deleted: false,
        created_at: now,
        updated_at: now,
      },
    });

    remaining -= monthlyRent;
    nextDueDate = nextDueDate.add(1, 'month');
  }

  // 🔔 Trigger notification to tenant (async IIFE pattern)
  void (async () => {
    try {
      await triggerNotification(
        tenantId,
        'RENT_PAYMENT_RECORDED',
        'Manual Rent Payment Recorded',
        `Your landlord has recorded a rent payment of $${amount.toFixed(2)} (${paymentType}).`
      );
    } catch (err) {
      console.error('Failed to send notification:', err);
    }
  })();

  // 9. Return a summary of the payment made
  return {
    status: paymentType,
    months_paid: monthsCovered,
    amount_paid: amount,
  };
};

export const markManualInitialRentPayment = async ({ landlordId, tenantId, agreementId, amount, method, notes }) => {
  const agreement = await prisma.rental_agreements.findUnique({
    where: { id: agreementId },
    include: { properties: true, property_units: true },
  });

  if (!agreement) throw new NotFoundError('Agreement not found');
  if (agreement.owner_id !== landlordId) throw new ForbiddenError('Unauthorized: You do not own this agreement');
  if (agreement.tenant_id !== tenantId) throw new ForbiddenError('Tenant does not match this agreement');
  if (agreement.status !== 'pending_payment') {
    throw new ForbiddenError('Agreement must be in pending payment state before payment');
  }
  if (!agreement.tenant_accepted_agreement) {
    throw new ForbiddenError('Tenant must accept the agreement before payment');
  }

  const rentAmount = parseFloat(agreement.properties?.price || 0);
  const securityDeposit = parseFloat(agreement.security_deposit || '0');
  const totalDue = rentAmount + securityDeposit;

  if (!rentAmount) throw new ServerError('Monthly rent amount not set for this property');
  if (amount < totalDue) {
    throw new ForbiddenError(`Initial payment must be at least ${totalDue}.`);
  }

  const now = new Date();
  const transactionId = `MANUAL-${uuidv4()}`;
  const periodCovered = generatePeriodCovered(now);

  // Initial rent payment
  const rentPaymentData = {
    id: uuidv4(),
    rental_agreement_id: agreementId,
    tenant_id: tenantId,
    property_id: agreement.property_id,
    unit_id: agreement.unit_id,
    payment_date: now,
    due_date: now,
    amount_paid: rentAmount,
    due_amount: rentAmount,
    method,
    transaction_id: transactionId,
    period_covered: periodCovered,
    status: 'completed',
    type: 'rent',
    notes,
    created_at: now,
    updated_at: now,
  };

  // Security deposit payment
  const securityDepositData = {
    id: uuidv4(),
    rental_agreement_id: agreementId,
    tenant_id: tenantId,
    property_id: agreement.property_id,
    unit_id: agreement.unit_id,
    payment_date: now,
    due_date: now,
    amount_paid: securityDeposit,
    due_amount: securityDeposit,
    method,
    transaction_id: transactionId,
    period_covered: null,
    status: 'completed',
    type: 'security_deposit',
    notes,
    created_at: now,
    updated_at: now,
  };

  // Update agreement & property status
  const updateAgreement = prisma.rental_agreements.update({
    where: { id: agreementId },
    data: { status: 'active', start_date: now, updated_at: now },
  });

  const updatePropertyStatus = agreement.properties.has_units
    ? prisma.property_units.update({ where: { id: agreement.unit_id }, data: { status: 'occupied' } })
    : prisma.properties.update({ where: { id: agreement.property_id }, data: { status: 'occupied' } });

  // Handle excess amount (for future months)
  let excessAmount = amount - totalDue;
  let futureDueDate = dayjs(now).add(1, 'month');
  const futurePayments = [];

  while (excessAmount > 0) {
    const amountToApply = Math.min(excessAmount, rentAmount);
    const status = amountToApply < rentAmount ? 'partially_paid' : 'completed';

    futurePayments.push(
      prisma.rent_payments.create({
        data: {
          id: uuidv4(),
          rental_agreement_id: agreementId,
          tenant_id: tenantId,
          property_id: agreement.property_id,
          unit_id: agreement.unit_id,
          due_date: futureDueDate.toDate(),
          due_amount: rentAmount,
          amount_paid: amountToApply,
          method,
          transaction_id: transactionId,
          period_covered: generatePeriodCovered(futureDueDate),
          status,
          is_deleted: false,
          type: 'rent',
          notes,
          created_at: now,
          updated_at: now,
        },
      })
    );

    excessAmount -= amountToApply;
    futureDueDate = futureDueDate.add(1, 'month');
  }

  // Execute DB transaction
  const [initialRentPayment, securityDepositPayment, , propertyStatusUpdate, ...futureRentPayments] =
    await prisma.$transaction([
      prisma.rent_payments.create({ data: rentPaymentData }),
      prisma.rent_payments.create({ data: securityDepositData }),
      updateAgreement,
      updatePropertyStatus,
      ...futurePayments,
    ]);

  // Send notification
  void (async () => {
    try {
      await triggerNotification(
        tenantId,
        'RENT_PAYMENT_RECORDED',
        'Initial Manual Rent Payment Recorded',
        `Your landlord recorded your initial payment of $${amount.toFixed(2)} for ${agreement.properties.property_name}.`
      );
    } catch (err) {
      console.error('Failed to send notification:', err);
    }
  })();

  return {
    rent_payment: initialRentPayment,
    security_deposit_payment: securityDepositPayment,
    future_payments: futureRentPayments,
    agreement_status: 'active',
  };
};


// Helper to generate a string like "2025-07" based on a given date
function generatePeriodCovered(date = new Date()) {
  const d = dayjs(date);
  return `${d.year()}-${String(d.month() + 1).padStart(2, '0')}`;
}



export default {
  markManualPayment,
  markManualInitialRentPayment,
};
