// payment-allocation.util.js
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { formatPeriodString, buildPeriodObject } from './generate-rent-period.util.js';
import { simulateFlutterwaveRentPayment } from '../services/flutterwave.service.js'

/**
 * Determine transaction ID: real payment or manual
 */
async function getTransactionId(method, tenantId, agreementId, amount) {
  if (method === 'Flutterwave') {
    const payment = await simulateFlutterwaveRentPayment({ userId: tenantId, agreementId, amount });
    return payment.transaction_id;
  }
  return `MANUAL-${uuidv4()}`;
}

/**
 * Apply a given amount to existing due payments (oldest-first).
 * collectPeriod(updatedPeriodObject, completedFlag) is optional and used to collect coveredPeriods.
 */
export async function applyToDues(tx, duePayments, remaining, method, notes, now, captureLastId, captureCompleted, collectPeriod, tenantId, agreementId) {
  console.log('[applyToDues] Allocating to dues. Remaining:', remaining);

  for (const p of duePayments) {
    if (remaining <= 0) break;

    const balance = parseFloat(p.due_amount) - parseFloat(p.amount_paid || 0);
    if (balance <= 0) continue;

    const payNow = Math.min(remaining, balance);
    const newPaid = parseFloat(p.amount_paid || 0) + payNow;

    const dueStart = dayjs(p.due_date || new Date());
    const transaction_id = await getTransactionId(method, tenantId, agreementId, payNow);

    const updated = await tx.rent_payments.update({
      where: { id: p.id },
      data: {
        amount_paid: newPaid,
        status: newPaid >= parseFloat(p.due_amount) ? 'completed' : 'partial',
        method,
        payment_date: now,
        transaction_id,
        notes,
        updated_at: now,
        period_covered: formatPeriodString(dueStart, 30),
      },
    });

    if (collectPeriod) {
      collectPeriod(buildPeriodObject(dueStart, 30), updated.status !== 'completed');
    }

    remaining -= payNow;
    if (captureLastId) captureLastId(updated.id);
    if (captureCompleted && updated.status === 'completed') captureCompleted(updated.id);
  }

  return remaining;
}

/**
 * Create advance payments (30-day increments) starting from lastStartDate.
 */
export async function createAdvancePayments(tx, agreement, tenantId, monthlyRent, remaining, method, notes, now, lastStartDate, captureLastId, captureCompleted, days = 30) {
  let nextStart = dayjs(lastStartDate);
  const payments = [];

  console.log('[createAdvancePayments] Remaining to allocate as advance:', remaining);

  while (remaining >= monthlyRent) {
    const transaction_id = await getTransactionId(method, tenantId, agreement.id, monthlyRent);
    const id = uuidv4();
    const periodString = formatPeriodString(nextStart, days);

    const payment = {
      id,
      rental_agreement_id: agreement.id,
      tenant_id: tenantId,
      property_id: agreement.property_id,
      unit_id: agreement.unit_id,
      due_date: nextStart.toDate(),
      due_amount: monthlyRent,
      amount_paid: monthlyRent,
      method,
      payment_date: now,
      transaction_id,
      period_covered: periodString,
      status: 'completed',
      notes,
      is_deleted: false,
      created_at: now,
      updated_at: now,
    };

    payments.push(payment);
    if (captureLastId) captureLastId(id);
    if (captureCompleted) captureCompleted(id);

    remaining -= monthlyRent;
    nextStart = nextStart.add(days, 'day');
  }

  if (payments.length) {
    await tx.rent_payments.createMany({ data: payments, skipDuplicates: true });
    console.log(`[createAdvancePayments] Created ${payments.length} advance payments successfully.`);
  } else {
    console.log('[createAdvancePayments] No advance payments created, remaining amount < monthlyRent.');
  }

  const lastAdvanceId = payments.length ? payments[payments.length - 1].id : null;
  return { remaining, nextDueDate: nextStart, lastAdvanceId, advancePayments: payments };
}

/**
 * Create a new partial payment for leftover amount
 */
export async function createPartialPayment(tx, agreement, tenantId, monthlyRent, remaining, method, notes, nextStartDate, now, days = 30) {
  const start = dayjs(nextStartDate);
  const transaction_id = await getTransactionId(method, tenantId, agreement.id, remaining);
  const periodString = formatPeriodString(start, days);

  const rec = await tx.rent_payments.create({
    data: {
      id: uuidv4(),
      rental_agreement_id: agreement.id,
      tenant_id: tenantId,
      property_id: agreement.property_id,
      unit_id: agreement.unit_id,
      due_date: start.toDate(),
      due_amount: monthlyRent,
      amount_paid: remaining,
      method,
      payment_date: now,
      transaction_id,
      period_covered: periodString,
      status: 'partial',
      notes,
      is_deleted: false,
      created_at: now,
      updated_at: now,
    },
  });

  return { record: rec, period: buildPeriodObject(start, days) };
}
