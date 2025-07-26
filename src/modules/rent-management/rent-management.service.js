import prisma from '../../prisma-client.js';
import { simulateFlutterwaveRentPayment } from '../../common/services/flutterwave.service.js';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

import {
  NotFoundError,
  AuthError,
  ServerError,
  ForbiddenError,
} from '../../common/services/errors.js';

export const getCurrentRentalDetails = async ( { userId, propertyId, unitId} ) => {
  const whereClause = {
    tenant_id: userId,
    property_id: propertyId,
    is_deleted: false,
    status: { in: ['active', 'completed'] }
  }

  if (unitId) whereClause.unit_id = unitId

  const agreement = await prisma.rental_agreements.findFirst({
    where: whereClause,
    include: {
      properties: true,
      property_units: true,
      users_rental_agreements_owner_idTousers: true,
      rent_payments: {
        where: { is_deleted: false },
        orderBy: { payment_date: 'desc' },
        take: 1,
      }
    }
  });

  if (!agreement) throw new NotFoundError('Active rental agreement not found', { field: 'Property ID or Unit ID or User ID' });
  const lastPayment = agreement.rent_payments[0];

  const unit = agreement.property_units;
  const landlord = agreement.users_rental_agreements_owner_idTousers;

  const nextDuePayment = await prisma.rent_payments.findFirst({
    where: {
      rental_agreement_id: agreement.id,
      tenant_id: userId,
      is_deleted: false,
      status: { in: ['pending', 'overdued'] },
    },
    orderBy: { due_date: 'asc' },
  });  

  const today = dayjs();
  const dueDate = nextDuePayment?.due_date;
  const daysUntilDue = dueDate ? dayjs(dueDate).diff(today, 'day') : null;

  return {
    property_name: agreement.properties?.property_name,
    property_thumbnail_url: agreement.properties?.thumbnail_image_path,
    unit: unit
      ? {
          unit_number: unit.unit_number,
          unit_price: unit.price?.toString() + ' UGX',
        }
      : null,
    landlord: landlord
      ? {
          name: landlord.full_name,
          contact_phone: landlord.phone_number,
          contact_email: landlord.email,
        }
      : null,
    lease_start_date: agreement.start_date?.toISOString().split('T')[0],
    next_rent_due_date: dueDate?.toISOString().split('T')[0] || null,
    days_until_due: daysUntilDue,
    agreement_status: agreement.status,
    last_payment: lastPayment
      ? {
          amount: parseFloat(lastPayment.amount_paid),
          date: lastPayment.payment_date.toISOString().split('T')[0],
        }
      : null,
    monthly_rent_amount: parseFloat(unit?.price || agreement.properties?.price || 0),
    payment_due: !!nextDuePayment,
  };

};

export const initiateRentPayment = async ({ userId, payment_method, amount }) => {
  const duePayments = await prisma.rent_payments.findMany({
    where: {
      tenant_id: userId,
      status: { in: ['pending', 'overdued'] },
      is_deleted: false,
    },
    orderBy: { due_date: 'asc' },
  });

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
    receipt_url: `https://nyumban.com/receipts/RENT-${dayjs().format('YYYYMMDD')}-${Math.floor(Math.random() * 1000)}.pdf`,
  };
};


export const getPaymentHistory = async ({ userId }) => {
  const payments = await prisma.rent_payments.findMany({
    where: {
      tenant_id: userId,
      is_deleted: false,
      status: 'completed',
    },
    include: {
      properties: true,
      rental_agreements: true,
      property_units: true,
    },
    orderBy: {
      payment_date: 'desc',
    },
  });

  return payments.map(payment => {
    return {
      property_name: payment.properties?.property_name || 'N/A',
      unit: payment.property_units?.unit_number || '',
      period_covered: formatMonthlyPeriod(payment.due_date),
      payment_date: payment.payment_date?.toISOString(),
      amount_paid: parseFloat(payment.amount_paid || 0),
      method: payment.method || 'N/A',
      status: 'paid',
      notes: payment.notes || '',
      transaction_id: payment.transaction_id || '',
    };
  });
};

export const getRentStatus = async ({ userId }) => {
  const activeAgreement = await prisma.rental_agreements.findFirst({
    where: {
      tenant_id: userId,
      is_deleted: false,
      status: 'active'
    },
    include: {
      property_units: true,
      properties: true,
      rent_payments: {
        where: { is_deleted: false },
        orderBy: { due_date: 'asc'},
      }
    }
  })

  if (!activeAgreement) throw new NotFoundError('Active rental agreement not found')
  
  const unit = activeAgreement.property_units;
  const property = activeAgreement.properties;

  const allPayments= activeAgreement.rent_payments;
  const nextDue = allPayments.find(p => ['pending', 'overdued'].includes(p.status))
  const lastPaid = allPayments.reverse().find(p => p.status === 'completed')

  const rentAmount = parseFloat(nextDue?.due_amount || unit?.price || 0)
  const amountPaid = parseFloat(nextDue?.amount_paid || 0)
  const outstanding = Math.max(0, rentAmount - amountPaid);

  let status = 'upcoming';
  if (!nextDue) status = 'paid';
  else if (nextDue.status === 'overdued') status = 'overdue';
  else if (amountPaid > 0 && amountPaid < rentAmount) status = 'partially_paid';
  else if (amountPaid >= rentAmount) status = 'paid';

  return {
    property_id: activeAgreement.property_id,
    unit: unit?.unit_number || 'N/A',
    rent_amount: rentAmount,
    period_due: nextDue ? {
      start: dayjs(nextDue.due_date).startOf('month').format('YYYY-MM-DD'),
      end: dayjs(nextDue.due_date).endOf('month').format('YYYY-MM-DD'),
    } : null,
    status,
    amount_paid: amountPaid,
    outstanding_balance: outstanding,
    can_pay_advance: true,
    max_months_advance: 6,
  };

}

// services/rent-management.service.js
export const checkAdvanceEligibility = async ({ userId, propertyId }) => {
  const agreement = await prisma.rental_agreements.findFirst({
    where: {
      tenant_id: userId,
      property_id: propertyId,
      is_deleted: false,
      status: { in: ['active', 'completed'] },
    },
  });

  if (!agreement) throw new NotFoundError('Rental agreement not found');

  const unit = await prisma.property_units.findUnique({
    where: { id: agreement.unit_id },
  });

  if (!unit) throw new NotFoundError('Unit info not found', { field: 'Unit ID' });

  // Assume this comes from landlord configuration or fallback default
  const maxMonthsAdvance = unit.max_months_advance ?? 6;

  return {
    can_pay_advance: true,
    max_months_advance: maxMonthsAdvance,
  };
};


function generatePeriodCovered(date = new Date()) {
  const d = dayjs(date);
  return `${d.year()}-${String(d.month() + 1).padStart(2, '0')}`;
}

function formatMonthlyPeriod(date) {
  if (!date) return '';

  const start = dayjs(date).startOf('month').format('YYYY-MM-DD');
  const end = dayjs(date).endOf('month').format('YYYY-MM-DD');
  return `${start} - ${end}`;
}

export default {
  getCurrentRentalDetails,
  initiateRentPayment,
  getPaymentHistory,
  getRentStatus, 
  checkAdvanceEligibility,
};
