import prisma from '../../prisma-client.js';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { applyToDues, createAdvancePayments} from './payment-allocation.util.js';
import { notifyTenant, notifyLandlord, notifyTenantInitialRentPayment, notifyLandlordInitialRentPayment } from './payment-notifications.service.js';
import { generatePeriodCovered } from './generate-rent-period.util.js';
import { validateAgreement, validateAgreementIntialRentPayment, fetchPendingDues, determineLastDueDate, createPartialPayment, determineStatusAndType } from './payment-utils.service.js';

import {
  NotFoundError,
  ForbiddenError,
  ServerError,
} from '../../common/services/errors-builder.service.js';

export const markManualInitialRentPayment = async ({
  landlordId,
  agreementId,
  amount,
  method,
  notes,
}) => {
  console.debug('[markManualInitialRentPayment] ▶️ Starting execution', {
    landlordId,
    agreementId,
    amount,
    method,
  });

  // 1. Validate agreement
  const agreement = await validateAgreementIntialRentPayment(landlordId, agreementId, {
    include: {
      properties: true,
      property_units: true,
      users_rental_agreements_tenant_idTousers: true,
    },
  });

  const rentAmount = parseFloat(agreement.monthly_rent || 0);
  const securityDeposit = parseFloat(agreement.security_deposit || 0);
  const totalDue = rentAmount + securityDeposit;

  if (amount < totalDue) {
    throw new ForbiddenError(`Initial payment must be at least ${totalDue}.`);
  }

  const now = new Date();
  const transactionId = `MANUAL-${uuidv4()}`;
  const coveredPeriods = []; // track full and partial coverage
  let partialPayment = null;

  let remaining = amount;
  let lastPaymentId = null;
  let completedCount = 0;

  const results = await prisma.$transaction(async (tx) => {
    // 2. Initial Rent Payment
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
        method,
        transaction_id: transactionId,
        period_covered: generatePeriodCovered(now),
        status: 'completed',
        type: 'rent',
        notes,
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

    // 3. Security Deposit
    const deposit = await tx.security_deposits.create({
      data: {
        rental_agreement_id: agreement.id,
        amount: securityDeposit,
        currency: 'UGX',
        method,
        status: 'held',
        transaction_id: transactionId,
        notes,
        created_at: now,
        updated_at: now,
      },
    });
    remaining -= securityDeposit;

    // 4. Overpayment → Advance + Partial
    let nextDueDate = dayjs(now).add(1, 'month');
    const advancePaymentsList = [];
    if (remaining > 0) {
      const { remaining: afterAdvance, nextDueDate: afterDueDate, advancePayments } =
        await createAdvancePayments(
          tx,
          agreement,
          agreement.tenant_id,
          rentAmount,
          remaining,
          method,
          notes,
          now,
          nextDueDate,
          (id) => (lastPaymentId = id),
          () => completedCount++
        );

      // Merge advancePayments to coveredPeriods
      advancePayments.forEach((p) => {
        coveredPeriods.push({
          start: dayjs(p.due_date).startOf('month').toDate(),
          end: dayjs(p.due_date).endOf('month').toDate(),
          partial: false,
        });
      });

      remaining = afterAdvance;
      nextDueDate = afterDueDate;

      // Keep track of advance payments for final response
      advancePaymentsList.push(...advancePayments);

      // Partial payment
      if (remaining > 0) {
        const partial = await createPartialPayment(
          tx,
          agreement,
          agreement.tenant_id,
          rentAmount,
          remaining,
          method,
          notes,
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

    // 5. Update agreement + property
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

    return { rentPayment, deposit, lastPaymentId, advancePaymentsList };
  });

  // 6. Notifications
  void notifyTenantInitialRentPayment({
    tenantId: agreement.tenant_id,
    rentAmount,
    securityDeposit,
    paymentMethod: method,
    paymentDate: now,
    propertyName: agreement.properties?.property_name || '',
    unitNumber: agreement.property_units?.unit_number || '',
    coveredPeriods,
    partialPayment,
  });

  void notifyLandlordInitialRentPayment({
    landlordId: agreement.owner_id || landlordId,
    tenantName: agreement.users_rental_agreements_tenant_idTousers?.username || '',
    rentAmount,
    securityDeposit,
    paymentMethod: method,
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
    amount_paid: amount,
    covered_periods: coveredPeriods,
    ...(partialPayment ? { partial_payment: partialPayment } : {}),
    outstanding_balance: remaining > 0 ? remaining : 0,
  };
};

export const markManualPayment = async ({ landlordId, tenantId, amount, method, notes, agreementId }) => {
  console.log('[markManualPayment] Input:', { landlordId, tenantId, amount, method, notes, agreementId });

  // 1. Validate agreement
  const agreement = await validateAgreement(landlordId, agreementId);
  console.log('[markManualPayment] Agreement validated. Monthly Rent:', agreement.monthly_rent);

  // 2. Fetch pending dues
  const duePayments = await fetchPendingDues(tenantId);
  console.log('[markManualPayment] Due payments found:', duePayments.length);

  // 3. Determine last due date
  const lastDueDate = await determineLastDueDate(tenantId, duePayments, agreement);

  const now = new Date();
  let remaining = amount;
  let lastPaymentId = null;
  let completedCount = 0;
  const coveredPeriods = []; // Track full and partial coverage
  let partialPayment = null;

  // 4. Transaction flow
  await prisma.$transaction(async (tx) => {
    remaining = await applyToDues(tx, duePayments, remaining, method, notes, now,
      (id) => lastPaymentId = id,
      () => completedCount++
    );

    const { remaining: afterAdvance, nextDueDate, lastAdvanceId, advancePayments } = await createAdvancePayments(
      tx, agreement, tenantId, parseFloat(agreement.monthly_rent), remaining, method, notes, now,
      dayjs(lastDueDate).add(1, 'month'),
      (id) => lastPaymentId = id,
      () => completedCount++
    );

    // Track advance payments for coveredPeriods
    advancePayments?.forEach(p => {
      coveredPeriods.push({
        start: dayjs(p.due_date).startOf('month').toDate(),
        end: dayjs(p.due_date).endOf('month').toDate(),
        partial: false
      });
    });

    remaining = afterAdvance;
    if (lastAdvanceId) lastPaymentId = lastAdvanceId;

    if (remaining > 0) {
      const partial = await createPartialPayment(tx, agreement, tenantId, parseFloat(agreement.monthly_rent), remaining, method, notes, nextDueDate, now);
      lastPaymentId = partial.id;

      partialPayment = {
        amount: remaining,
        period: {
          start: dayjs(nextDueDate).startOf('month').toDate(),
          end: dayjs(nextDueDate).endOf('month').toDate(),
        },
      };

      coveredPeriods.push({
        start: partialPayment.period.start,
        end: partialPayment.period.end,
        partial: true,
      });

      remaining = 0;
    }
  });

  // 5. Fetch last payment with proper relations
  const lastPayment = lastPaymentId
    ? await prisma.rent_payments.findUnique({
        where: { id: lastPaymentId },
        include: {
          rental_agreements: true,
          users: true,
          properties: true,
          property_units: true
        }
      })
    : null;

  // 6. Determine final status and payment type
  const { status, paymentType } = determineStatusAndType(lastPayment, remaining, completedCount, duePayments);
  console.log('[markManualPayment] Final status:', status, 'PaymentType:', paymentType, 'Months covered:', completedCount);

  const propertyName = lastPayment?.properties?.property_name || '';
  const unitNumber = lastPayment?.property_units?.unit_number || '';
  const tenantName = lastPayment?.users?.full_name || '';
  const landlordIdFromAgreement = lastPayment?.rental_agreements?.owner_id || landlordId;
  const remainingBalance = Math.max(0, parseFloat(agreement.monthly_rent) - remaining);

  // 7. Notifications
  void notifyTenant({
    tenantId,
    amount,
    paymentType,
    monthsCovered: completedCount,
    propertyName,
    unitNumber,
    paymentMethod: method,
    coveredPeriods,
    paymentDate: now,
    remainingBalance
  });

  void notifyLandlord({
    landlordId: landlordIdFromAgreement,
    tenantName,
    amount,
    paymentType,
    monthsCovered: completedCount,
    propertyName,
    unitNumber,
    paymentMethod: method,
    coveredPeriods,
    paymentDate: now
  });

  // 8. Return enriched API response
  return {
    rent_payment_id: lastPayment.id,
    agreement_status: agreement.status || 'active',
    months_paid: completedCount,
    amount_paid: amount,
    covered_periods: coveredPeriods,
    partial_payment: partialPayment,
    payment_method: method,
    remaining_balance: remainingBalance,
    payment_status: status,
    payment_type: paymentType
  };
  
};

export default {
  markManualPayment,
  markManualInitialRentPayment,
};
