import prisma from '../../prisma-client.js';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { triggerNotification } from '../notifications/notification.service.js';

import {
  ValidationError,
  NotFoundError,
  AuthError,
  ForbiddenError,
  ServerError,
} from '../../common/services/errors-builder.service.js';


// Helper to generate period covered like "09/01/2025 - 09/30/2025"
function generatePeriodCovered(date) {
  const d = dayjs(date);
  if (!d.isValid()) return 'Invalid Period';
  return `${d.startOf('month').format('MM/DD/YYYY')} - ${d.endOf('month').format('MM/DD/YYYY')}`;
}

// Main function to manually record a rent payment
export const markManualPayment = async ({ landlordId, tenantId, amount, method, notes, agreementId }) => {
  console.log('Agreement ID:', agreementId);

  // 1. Retrieve rental agreement
  const agreement = await prisma.rental_agreements.findUnique({ where: { id: agreementId } });
  if (!agreement) throw new NotFoundError('Agreement not found', { field: 'Agreement ID' });
  if (agreement.status !== 'active') throw new AuthError('Agreement is not active', { field: 'Agreement ID' });
  if (agreement.owner_id !== landlordId) throw new ForbiddenError('Unauthorized landlord', { field: 'Landlord ID' });

  const monthlyRent = parseFloat(agreement.monthly_rent?.toString() || '0');
  if (!monthlyRent || monthlyRent <= 0) throw new ServerError('Cannot determine monthly rent for this agreement.');

  // 2. Fetch unpaid/partially paid rent payments
  const duePayments = await prisma.rent_payments.findMany({
    where: { tenant_id: tenantId, status: { in: ['pending', 'overdued', 'partial'] }, is_deleted: false },
    orderBy: { due_date: 'asc' },
  });

  const totalDue = duePayments.reduce(
    (sum, p) => sum + (parseFloat(p.due_amount?.toString() || '0') - parseFloat(p.amount_paid?.toString() || '0')),
    0
  );

  // 3. Payment type and months covered
  let paymentType = 'partial';
  let monthsCovered = 0;
  if (amount >= monthlyRent) {
    paymentType = totalDue > 0 && amount <= totalDue ? 'paid' : 'advance';
    monthsCovered = Math.floor(amount / monthlyRent);
  }

  const now = new Date();
  let remaining = amount;

  // 4. Start transaction
  await prisma.$transaction(async (tx) => {
    // 4a. Apply to existing dues
    for (const p of duePayments) {
      if (remaining <= 0) break;
      const balance = parseFloat(p.due_amount?.toString() || '0') - parseFloat(p.amount_paid?.toString() || '0');
      if (balance <= 0) continue;

      const payNow = Math.min(remaining, balance);

      await tx.rent_payments.update({
        where: { id: p.id },
        data: {
          amount_paid: parseFloat(p.amount_paid?.toString() || '0') + payNow,
          status:
            payNow + parseFloat(p.amount_paid?.toString() || '0') >= parseFloat(p.due_amount?.toString() || '0')
              ? 'completed'
              : 'partial',
          method,
          payment_date: now,
          transaction_id: `MANUAL-${uuidv4()}`,
          notes,
          updated_at: now,
          period_covered: generatePeriodCovered(p.due_date),
        },
      });

      remaining -= payNow;
    }

    // 4b. Create full advance payments
    let lastDueDate = duePayments.length
      ? duePayments[duePayments.length - 1].due_date
      : agreement.start_date || now;

    let nextDueDate = dayjs(lastDueDate).add(1, 'month');
    const advancePayments = [];

    while (remaining >= monthlyRent) {
      advancePayments.push({
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
      });

      remaining -= monthlyRent;
      nextDueDate = nextDueDate.add(1, 'month');
    }

    if (advancePayments.length) {
      await tx.rent_payments.createMany({ data: advancePayments, skipDuplicates: true });
    }

    // 4c. Create final partial payment if remaining > 0
    if (remaining > 0) {
      await tx.rent_payments.create({
        id: uuidv4(),
        rental_agreement_id: agreement.id,
        tenant_id: tenantId,
        property_id: agreement.property_id,
        unit_id: agreement.unit_id,
        due_date: nextDueDate.toDate(),
        due_amount: monthlyRent,
        amount_paid: remaining,
        method,
        payment_date: now,
        transaction_id: `MANUAL-${uuidv4()}`,
        period_covered: generatePeriodCovered(nextDueDate),
        status: 'partial',
        notes,
        is_deleted: false,
        created_at: now,
        updated_at: now,
      });
    }
  });

  // 5. Fire notification (non-blocking)
  void (async () => {
    try {
      let message;
      if (paymentType === 'advance') {
        message = `Your landlord has recorded a rent payment of $${amount.toFixed(
          2
        )}, covering ${monthsCovered} month${monthsCovered > 1 ? 's' : ''} in advance.`;
      } else if (paymentType === 'paid') {
        message = `Your landlord has recorded a full rent payment of $${amount.toFixed(2)}.`;
      } else {
        message = `Your landlord has recorded a partial rent payment of $${amount.toFixed(2)}.`;
      }
      await triggerNotification(tenantId, 'user', 'Manual Rent Payment Recorded', message);
    } catch (err) {
      console.error('Failed to send notification:', err);
    }
  })();

  return { status: paymentType, months_paid: monthsCovered, amount_paid: amount };
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
    const status = amountToApply < rentAmount ? 'partial' : 'completed';

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

export default {
  markManualPayment,
  markManualInitialRentPayment,
};
