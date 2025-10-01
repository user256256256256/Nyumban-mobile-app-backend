// payment-allocation.util.js
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { formatPeriodString, buildPeriodObject } from './generate-rent-period.util.js';

/**
 * Apply a given amount to existing due payments (oldest-first).
 * collectPeriod(updatedPeriodObject, completedFlag) is optional and used to collect coveredPeriods.
 */
export async function applyToDues(tx, duePayments, remaining, method, notes, now, captureLastId, captureCompleted, collectPeriod) {
  console.log('[applyToDues] Allocating to dues. Remaining:', remaining);

  for (const p of duePayments) {
    if (remaining <= 0) break;

    const balance = parseFloat(p.due_amount) - parseFloat(p.amount_paid || 0);
    if (balance <= 0) continue;

    const payNow = Math.min(remaining, balance);
    const newPaid = parseFloat(p.amount_paid || 0) + payNow;

    console.log(`[applyToDues] Paying ${payNow} toward due ${p.id}. New paid: ${newPaid} / ${p.due_amount}`);

    // normalize due_date
    const dueStart = dayjs(p.due_date || new Date());

    const updated = await tx.rent_payments.update({
      where: { id: p.id },
      data: {
        amount_paid: newPaid,
        status: newPaid >= parseFloat(p.due_amount) ? 'completed' : 'partial',
        method,
        payment_date: now,
        transaction_id: `MANUAL-${uuidv4()}`,
        notes,
        updated_at: now,
        // persist DB-friendly string
        period_covered: formatPeriodString(dueStart, 30),
      },
    });

    // collect structured period for response/notifications
    if (collectPeriod && updated.status === 'completed') {
      collectPeriod(buildPeriodObject(dueStart, 30), false);
    } else if (collectPeriod && updated.status === 'partial') {
      collectPeriod(buildPeriodObject(dueStart, 30), true);
    }

    remaining -= payNow;
    if (captureLastId) captureLastId(updated.id);
    if (captureCompleted && updated.status === 'completed') captureCompleted(updated.id);
  }

  return remaining;
}

/**
 * Create advance payments (30-day increments) starting from lastStartDate.
 * lastDueDate param may be a Date or dayjs. Returns nextStartDate as dayjs.
 */
export async function createAdvancePayments(
  tx,
  agreement,
  tenantId,
  monthlyRent,
  remaining,
  method,
  notes,
  now,
  lastStartDate, // Date or dayjs
  captureLastId,
  captureCompleted,
  days = 30
) {
  let nextStart = dayjs(lastStartDate); // normalize
  const payments = [];

  console.log('[createAdvancePayments] Remaining to allocate as advance:', remaining);

  while (remaining >= monthlyRent) {
    const id = uuidv4();

    const periodString = formatPeriodString(nextStart, days);

    console.log(`[createAdvancePayments] Creating advance payment ${id} for due ${nextStart.format('YYYY-MM-DD')} with period_covered ${periodString}`);

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
      transaction_id: `MANUAL-${uuidv4()}`,
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
    // move by 'days' (30-day window)
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
