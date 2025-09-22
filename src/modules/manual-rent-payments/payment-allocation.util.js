import { v4 as uuidv4 } from 'uuid';
import { generatePeriodCovered } from './generate-rent-period.util.js';

export async function applyToDues(tx, duePayments, remaining, method, notes, now, captureLastId, captureCompleted) {
  console.log('[applyToDues] Allocating to dues. Remaining:', remaining);

  for (const p of duePayments) {
    if (remaining <= 0) break;

    const balance = parseFloat(p.due_amount) - parseFloat(p.amount_paid);
    if (balance <= 0) continue;

    const payNow = Math.min(remaining, balance);
    const newPaid = parseFloat(p.amount_paid) + payNow;

    console.log(`[applyToDues] Paying ${payNow} toward due ${p.id}. New paid: ${newPaid} / ${p.due_amount}`);

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
        period_covered: generatePeriodCovered(p.due_date),
      },
    });

    remaining -= payNow;
    if (captureLastId) captureLastId(updated.id);
    if (captureCompleted && updated.status === 'completed') captureCompleted(updated.id);
  }

  return remaining;
}


export async function createAdvancePayments(
  tx,
  agreement,
  tenantId,
  monthlyRent,
  remaining,
  method,
  notes,
  now,
  lastDueDate,
  captureLastId,
  captureCompleted
) {
  let nextDueDate = lastDueDate;
  const payments = [];

  console.log('[createAdvancePayments] Remaining to allocate as advance:', remaining);

  while (remaining >= monthlyRent) {
    const id = uuidv4();

    const periodCovered = generatePeriodCovered(nextDueDate);

    console.log(`[createAdvancePayments] Creating advance payment ${id} for due ${nextDueDate.format('YYYY-MM-DD')} with period_covered ${periodCovered}`);

    const payment = {
      id,
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
      period_covered: periodCovered,
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
    nextDueDate = nextDueDate.add(1, 'month');
  }

  if (payments.length) {
    await tx.rent_payments.createMany({ data: payments, skipDuplicates: true });
    console.log(`[createAdvancePayments] Created ${payments.length} advance payments successfully.`);
  } else {
    console.log('[createAdvancePayments] No advance payments created, remaining amount < monthlyRent.');
  }

  const lastAdvanceId = payments.length ? payments[payments.length - 1].id : null;
  return { remaining, nextDueDate, lastAdvanceId, advancePayments: payments };
}
