import prisma from '../../prisma-client.js';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { simulateFlutterwaveRentPayment } from '../../common/services/flutterwave.service.js';
import { generatePeriodCovered } from '../manual-rent-payments/generate-rent-period.util.js';
import { createAdvancePayments } from '../manual-rent-payments/payment-allocation.util.js';
import { notifyTenantInitialRentPayment, notifyLandlordInitialRentPayment } from '../manual-rent-payments/payment-notifications.service.js';
import { validateTenantAgreementInitialPayment, createPartialPayment } from '../manual-rent-payments/payment-utils.service.js';
import { ForbiddenError } from '../../common/services/errors-builder.service.js';

export const initialRentPayment = async ({
  userId,
  agreementId,
  amount_paid, 
  notes,  
}) => {
  console.debug('[initialRentPayment] ▶️ Starting execution', { userId, agreementId });

  // 1. Validate agreement
  const agreement = await validateTenantAgreementInitialPayment(userId, agreementId, {
    include: {
      properties: true,
      property_units: true,
      users_rental_agreements_tenant_idTousers: true,
    },
  });

  const rentAmount = parseFloat(agreement.monthly_rent || 0);
  const securityDeposit = parseFloat(agreement.security_deposit || 0);
  const defaultAmount = rentAmount + securityDeposit;
  const totalAmount = amount_paid ?? defaultAmount;

  if (totalAmount < defaultAmount) {
    throw new ForbiddenError(`Initial payment must be at least ${defaultAmount}.`);
  }

  const now = new Date();
  const coveredPeriods = [];
  let partialPayment = null;
  let remaining = totalAmount;
  let lastPaymentId = null;
  let completedCount = 0;

  // 2. Simulate Flutterwave payment
  const payment = await simulateFlutterwaveRentPayment({
    userId,
    agreementId,
    amount: totalAmount,
    metadata: { propertyId: agreement.property_id, unitId: agreement.unit_id },
  });

  // 3. Persist payments in DB
  const results = await prisma.$transaction(async (tx) => {
    // Rent Payment
    const rentPayment = await tx.rent_payments.create({
      data: {
        id: uuidv4(),
        rental_agreement_id: agreement.id,
        tenant_id: agreement.tenant_id,
        property_id: agreement.property_id,
        unit_id: agreement.unit_id,
        due_date: now,
        due_amount: rentAmount,
        amount_paid: rentAmount,
        payment_date: now,
        method: payment.method,
        transaction_id: payment.transaction_id,
        period_covered: generatePeriodCovered(now),
        status: 'completed',
        type: 'rent',
        notes: notes || 'Initial rent payment via Flutterwave',
        created_at: now,
        updated_at: now,
      },
    });

    lastPaymentId = rentPayment.id;
    remaining -= rentAmount;
    completedCount += 1;

    coveredPeriods.push({
      start: dayjs(now).startOf('month').toDate(),
      end: dayjs(now).endOf('month').toDate(),
      partial: false,
    });

    // Security Deposit
    const deposit = await tx.security_deposits.create({
      data: {
        rental_agreement_id: agreement.id,
        amount: securityDeposit,
        currency: payment.currency,
        method: payment.method,
        status: 'held',
        transaction_id: payment.transaction_id,
        notes: notes || 'Security deposit via Flutterwave',
        created_at: now,
        updated_at: now,
      },
    });

    remaining -= securityDeposit;

    // Overpayment → Advance + Partial
    let nextDueDate = dayjs(now).add(1, 'month');
    if (remaining > 0) {
      const { remaining: afterAdvance, nextDueDate: afterDueDate, advancePayments } =
        await createAdvancePayments(
          tx,
          agreement,
          agreement.tenant_id,
          rentAmount,
          remaining,
          payment.method,
          'Advance payment via Flutterwave',
          now,
          nextDueDate,
          (id) => (lastPaymentId = id),
          () => completedCount++
        );

      advancePayments.forEach((p) => {
        coveredPeriods.push({
          start: dayjs(p.due_date).startOf('month').toDate(),
          end: dayjs(p.due_date).endOf('month').toDate(),
          partial: false,
        });
      });

      remaining = afterAdvance;
      nextDueDate = afterDueDate;

      if (remaining > 0) {
        const partial = await createPartialPayment(
          tx,
          agreement,
          agreement.tenant_id,
          rentAmount,
          remaining,
          payment.method,
          'Partial payment via Flutterwave',
          dayjs(nextDueDate),
          now
        );
        lastPaymentId = partial.id;

        partialPayment = {
          amount: remaining,
          period: {
            start: dayjs(nextDueDate).startOf('month').toDate(),
            end: dayjs(nextDueDate).endOf('month').toDate(),
          },
        };

        coveredPeriods.push({
          start: dayjs(nextDueDate).startOf('month').toDate(),
          end: dayjs(nextDueDate).endOf('month').toDate(),
          partial: true,
        });

        remaining = 0;
      }
    }

    // Update agreement + property/unit
    await tx.rental_agreements.update({
      where: { id: agreement.id },
      data: { status: 'active', start_date: now, updated_at: now },
    });

    if (agreement.properties?.has_units) {
      await tx.property_units.update({
        where: { id: agreement.unit_id },
        data: { status: 'occupied' },
      });
    } else if (agreement.properties) {
      await tx.properties.update({
        where: { id: agreement.property_id },
        data: { status: 'occupied' },
      });
    }

    return { rentPayment, deposit };
  });

  // 4. Notifications
  void notifyTenantInitialRentPayment({
    tenantId: agreement.tenant_id,
    rentAmount,
    securityDeposit,
    paymentMethod: payment.method,
    paymentDate: now,
    propertyName: agreement.properties?.property_name || '',
    unitNumber: agreement.property_units?.unit_number || '',
    coveredPeriods,
    partialPayment,
  });

  void notifyLandlordInitialRentPayment({
    landlordId: agreement.owner_id,
    tenantName: agreement.users_rental_agreements_tenant_idTousers?.username || '',
    rentAmount,
    securityDeposit,
    paymentMethod: payment.method,
    paymentDate: now,
    propertyName: agreement.properties?.property_name || '',
    unitNumber: agreement.property_units?.unit_number || '',
    coveredPeriods,
    partialPayment,
  });

  return {
    rent_payment: results.rentPayment,
    security_deposit: results.deposit,
    agreement_status: 'active',
    months_paid: completedCount,
    amount_paid: totalAmount,
    covered_periods: coveredPeriods,
    ...(partialPayment ? { partial_payment: partialPayment } : {}),
    outstanding_balance: remaining > 0 ? remaining : 0,
  };
};





























export const rentPayment = async ({ userId, payment_method, amount }) => {
  const duePayments = await prisma.rent_payments.findMany({
    where: {
      tenant_id: userId,
      status: { in: ['pending', 'overdued'] },
      is_deleted: false,
    },
    orderBy: { due_date: 'asc' },
  });

  if (agreement.status === 'terminated') {
    throw new ForbiddenError('This agreement has been terminated. Payments are not allowed.');
  }

  if (!duePayments.length) throw new NotFoundError('No due rent payments found');

  const agreement = await prisma.rental_agreements.findUnique({
    where: { id: duePayments[0].rental_agreement_id },
    include: { properties: true },
  });

  if (!agreement || agreement.tenant_id !== userId) {
    throw new AuthError('Unauthorized payment attempt');
  }

  const monthlyRent = parseFloat(duePayments[0].due_amount);
  const totalDue = duePayments.reduce((acc, p) => acc + parseFloat(p.due_amount || 0) - parseFloat(p.amount_paid || 0), 0);

  let paymentType = 'partial';
  let monthsCovered = 0;

  if (amount >= totalDue) {
    // Advance payment
    paymentType = 'advance';
    monthsCovered = Math.floor(amount / monthlyRent);
  } else if (amount >= monthlyRent) {
    // Full payment of at least one due period
    paymentType = 'paid';
    monthsCovered = Math.floor(amount / monthlyRent);
  } else {
    // Partial
    monthsCovered = 0;
    paymentType = 'partially_paid';
  }

  const payment = await simulateFlutterwaveRentPayment({
    userId,
    agreementId: agreement.id,
    amount,
    metadata: {
      propertyId: agreement.property_id,
      unitId: agreement.unit_id,
    },
  });

  const now = new Date();
  let remainingAmount = amount;

  // Pay off current due payments first
  for (const paymentDue of duePayments) {
    const due = parseFloat(paymentDue.due_amount);
    const alreadyPaid = parseFloat(paymentDue.amount_paid || 0);
    const balance = due - alreadyPaid;

    if (remainingAmount <= 0) break;

    const payNow = Math.min(balance, remainingAmount);

    await prisma.rent_payments.update({
      where: { id: paymentDue.id },
      data: {
        amount_paid: alreadyPaid + payNow,
        status: payNow + alreadyPaid >= due ? 'completed' : 'partially_paid',
        payment_date: now,
        method: payment_method,
        transaction_id: payment.transaction_id,
        updated_at: now,
      },
    });

    remainingAmount -= payNow;
  }

  // Create advance months if applicable
  const lastDueDate = duePayments[duePayments.length - 1].due_date;
  let nextDueDate = dayjs(lastDueDate).add(1, 'month');

  while (remainingAmount >= monthlyRent) {
    await prisma.rent_payments.create({
      data: {
        id: uuidv4(),
        rental_agreement_id: agreement.id,
        tenant_id: userId,
        property_id: agreement.property_id,
        unit_id: agreement.unit_id,
        due_date: nextDueDate.toDate(),
        due_amount: monthlyRent,
        amount_paid: monthlyRent,
        method: payment_method,
        transaction_id: payment.transaction_id,
        period_covered: generatePeriodCovered(nextDueDate),
        status: 'completed',
        is_deleted: false,
        created_at: now,
        updated_at: now,
      },
    });

    remainingAmount -= monthlyRent;
    nextDueDate = nextDueDate.add(1, 'month');
  }

  return {
    message: 'Payment successful',
    status: paymentType,
    transaction_id: payment.transaction_id,
    receipt_url: `https://nyumbanapp.com/receipts/RENT-${dayjs().format('YYYYMMDD')}-${Math.floor(Math.random() * 1000)}.pdf`,
  };
};

export default {
  rentPayment,
  initialRentPayment,
}