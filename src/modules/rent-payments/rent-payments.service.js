// rent-payments.service.js (excerpt updated)
import prisma from '../../prisma-client.js';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { simulateFlutterwaveRentPayment } from '../../common/services/flutterwave.service.js';
import { formatPeriodString, buildPeriodObject } from '../../common/utils/generate-rent-period.util.js';
import { createAdvancePayments, applyToDues, createPartialPayment, } from '../../common/utils/payment-allocation.util.js';
import { notifyTenant, notifyLandlord, notifyTenantInitialRentPayment, notifyLandlordInitialRentPayment } from '../manual-rent-payments/payment-notifications.service.js';
import { validateTenantAgreementInitialPayment, validateAgreement, fetchPendingDues, determineLastDueDate, determineStatusAndType } from '../../common/services/payment-utils.service.js';
import { ForbiddenError } from '../../common/services/errors-builder.service.js';

export const rentPayment = async ({ userId, agreementId, amount, method = 'Flutterwave', notes }) => {
  console.log('[rentPayment] Input:', { userId, agreementId, amount, method, notes });

  // 1. Validate agreement
  const agreement = await validateAgreement(userId, agreementId);
  if (agreement.status === 'terminated') {
    throw new ForbiddenError('This agreement has been terminated. Payments are not allowed.');
  }
  console.log('[rentPayment] Agreement validated. Monthly Rent:', agreement.monthly_rent);

  // 2. Fetch pending dues
  const duePayments = await fetchPendingDues(userId);
  console.log('[rentPayment] Due payments found:', duePayments.length);

  // 3. Determine last due date
  const lastDueDate = await determineLastDueDate(userId, duePayments, agreement);
  const lastDueDayjs = dayjs(lastDueDate || new Date());

  const now = new Date();
  let remaining = amount;
  let lastPaymentId = null;
  let completedCount = 0;
  const coveredPeriods = [];
  let partialPayment = null;

  // 4. Simulate Flutterwave payment
  const payment = await simulateFlutterwaveRentPayment({
    userId,
    agreementId,
    amount,
    metadata: { propertyId: agreement.property_id, unitId: agreement.unit_id },
  });

  // 5. Transaction flow
  await prisma.$transaction(async (tx) => {
    // Apply to pending dues. Provide collector callback to build structured coveredPeriods.
    remaining = await applyToDues(
      tx,
      duePayments,
      remaining,
      method,
      notes,
      now,
      (id) => (lastPaymentId = id),
      () => completedCount++,
      (periodObj, isPartial) => {
        coveredPeriods.push({ start: periodObj.start, end: periodObj.end, partial: !!isPartial });
      }
    );

    // Advance payments — start from lastDueDate + 30 days
    const advanceStart = lastDueDayjs.add(30, 'day');
    const { remaining: afterAdvance, nextDueDate, lastAdvanceId, advancePayments } =
      await createAdvancePayments(
        tx,
        agreement,
        userId,
        parseFloat(agreement.monthly_rent),
        remaining,
        method,
        notes || 'Advance payment via Flutterwave',
        now,
        advanceStart,
        (id) => (lastPaymentId = id),
        () => completedCount++
      );

    // Track advance payments for structured coveredPeriods
    advancePayments?.forEach((p) => {
      // p.due_date is a Date — use buildPeriodObject
      coveredPeriods.push(buildPeriodObject(p.due_date, 30));
      // mark full coverage
      coveredPeriods[coveredPeriods.length - 1].partial = false;
    });

    remaining = afterAdvance;
    if (lastAdvanceId) lastPaymentId = lastAdvanceId;

    // Partial payment — create partial and collect period object from return
    if (remaining > 0) {
      // createPartialPayment should now return { record, period }
      const partial = await createPartialPayment(
        tx,
        agreement,
        userId,
        parseFloat(agreement.monthly_rent),
        remaining,
        method,
        notes || 'Partial payment via Flutterwave',
        nextDueDate, // dayjs returned by createAdvancePayments
        now,
        30
      );

      // If createPartialPayment returns record directly (old behavior), adapt:
      let rec, periodObj;
      if (partial?.record) {
        rec = partial.record;
        periodObj = partial.period;
      } else {
        // backward compatibility: partial is DB record and periodString stored in period_covered
        rec = partial;
        // parse stored period_covered string to object (best-effort)
        const [startS, endS] = (partial.period_covered || '').split(' - ');
        periodObj = startS && endS ? { start: dayjs(startS, 'MM/DD/YYYY').toDate(), end: dayjs(endS, 'MM/DD/YYYY').toDate() } : buildPeriodObject(nextDueDate, 30);
      }

      lastPaymentId = rec.id;

      partialPayment = {
        amount: remaining,
        period: periodObj,
      };

      coveredPeriods.push({ start: periodObj.start, end: periodObj.end, partial: true });

      remaining = 0;
    }
  });

  // 6. Fetch last payment with relations
  const lastPayment = lastPaymentId
    ? await prisma.rent_payments.findUnique({
        where: { id: lastPaymentId },
        include: {
          rental_agreements: true,
          users: true,
          properties: true,
          property_units: true,
        },
      })
    : null;

  // 7. Determine status + type
  const { status, paymentType } = determineStatusAndType(
    lastPayment,
    remaining,
    completedCount,
    duePayments
  );
  console.log('[rentPayment] Final status:', status, 'Type:', paymentType, 'Months covered:', completedCount);

  const propertyName = lastPayment?.properties?.property_name || '';
  const unitNumber = lastPayment?.property_units?.unit_number || '';
  const tenantName = lastPayment?.users?.full_name || '';
  const landlordIdFromAgreement = lastPayment?.rental_agreements?.owner_id || agreement.owner_id;
  const remainingBalance = Math.max(0, parseFloat(agreement.monthly_rent) - remaining);

  // 8. Notifications
  void notifyTenant({
    tenantId: userId,
    amount,
    paymentType,
    monthsCovered: completedCount,
    propertyName,
    unitNumber,
    paymentMethod: method,
    coveredPeriods,
    paymentDate: now,
    remainingBalance,
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
    paymentDate: now,
  });

  // 9. Return enriched response
  return {
    rent_payment_id: lastPayment?.id,
    agreement_status: agreement.status || 'active',
    months_paid: completedCount,
    amount_paid: amount,
    covered_periods: coveredPeriods,
    partial_payment: partialPayment,
    payment_method: method,
    remaining_balance: remainingBalance,
    payment_status: status,
    payment_type: paymentType,
    transaction_id: payment.transaction_id,
  };
};

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
    // Rent Payment (first 30-day block)
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
        period_covered: formatPeriodString(now, 30), // ✅ new util
        status: 'completed',
        notes: notes || 'Initial rent payment via Flutterwave',
        created_at: now,
        updated_at: now,
      },
    });

    lastPaymentId = rentPayment.id;
    remaining -= rentAmount;
    completedCount += 1;

    // Push structured 30-day period
    coveredPeriods.push({ ...buildPeriodObject(now, 30), partial: false });

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
    let nextDueDate = dayjs(now).add(30, 'day'); // ✅ step forward by 30 days
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
        coveredPeriods.push({ ...buildPeriodObject(p.due_date, 30), partial: false });
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
          period: buildPeriodObject(nextDueDate, 30),
        };

        coveredPeriods.push({ ...partialPayment.period, partial: true });

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

export default {
  rentPayment,
  initialRentPayment,
}
