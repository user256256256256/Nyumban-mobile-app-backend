import prisma from '../../prisma-client.js';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

import {
  ValidationError,
  NotFoundError,
  AuthError,
  ForbiddenError,
  ServerError,
} from '../../common/services/errors.js';

export const markManualPayment = async ({ tenantId, amount, method, notes, landlordId }) => {
    const duePayments = await prisma.rent_payments.findMany({
      where: {
        tenant_id: tenantId,
        status: { in: ['pending', 'overdued'] },
        is_deleted: false,
      },
      orderBy: { due_date: 'asc' },
    });
  
    if (!duePayments.length) throw new NotFoundError('No due rent payments found');
  
    const agreement = await prisma.rental_agreements.findUnique({
      where: { id: duePayments[0].rental_agreement_id },
    });
  
    if (!agreement || agreement.owner_id !== landlordId) {
      throw new ForbiddenError('Unauthorized: You do not own this agreement');
    }
  
    const monthlyRent = parseFloat(duePayments[0].due_amount);
    const totalDue = duePayments.reduce((sum, p) => sum + (parseFloat(p.due_amount) - parseFloat(p.amount_paid || 0)), 0);
  
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
  
    for (const p of duePayments) {
      const balance = parseFloat(p.due_amount) - parseFloat(p.amount_paid || 0);
      if (remaining <= 0) break;
  
      const payNow = Math.min(remaining, balance);
  
      await prisma.rent_payments.update({
        where: { id: p.id },
        data: {
          amount_paid: parseFloat(p.amount_paid || 0) + payNow,
          status: payNow + parseFloat(p.amount_paid || 0) >= parseFloat(p.due_amount) ? 'completed' : 'partially_paid',
          method,
          payment_date: now,
          transaction_id: `MANUAL-${uuidv4()}`,
          notes,
          updated_at: now,
        },
      });
  
      remaining -= payNow;
    }
  
    // Advance payment if balance remains
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
  
    return {
      status: paymentType,
      months_paid: monthsCovered,
      amount_paid: amount,
    };
};
  
function generatePeriodCovered(date = new Date()) {
    const d = dayjs(date);
    return `${d.year()}-${String(d.month() + 1).padStart(2, '0')}`;
}

export default {
    markManualPayment
}