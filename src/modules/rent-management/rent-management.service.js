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

  if (!agreement) throw new NotFoundError('Active rental agreement not found');
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

export const initiateRentPayment = async ({ userId, payment_method }) => {
  const duePayment = await prisma.rent_payments.findFirst({
    where: { 
      tenant_id: userId,
      status: { in: ['pending', 'overdued'] },
      is_deleted: false,
    },
    orderBy: { due_date: 'asc' },
  })

  if (!duePayment) throw new NotFoundError('No due rent payment found');
  const agreement = await prisma.rental_agreements.findUnique({
    where: { id: duePayment.rental_agreement_id },
    include: { properties: true },
  });

  if (!agreement) throw new NotFoundError('Associated agreement not found');
  if (agreement.tenant_id !== userId) throw new AuthError('Unauthorized payment attempt');

  const rentAmount = parseFloat(duePayment.due_amount);
  if (!rentAmount) throw new ServerError('Invalid rent amount');

  const payment = await simulateFlutterwaveRentPayment({
    userId,
    agreementId: agreement.id,
    amount: rentAmount,
    metadata: {
      propertyId: duePayment.property_id,
      unitId: duePayment.unit_id,
    },
  });

  await prisma.rent_payments.update({
    where: { id: duePayment.id },
    data: {
      payment_date: new Date(),
      amount_paid: rentAmount,
      method: payment_method,
      transaction_id: payment.transaction_id,
      status: 'completed',
      updated_at: new Date(),
    },
  });

  const nextDueDate = dayjs(duePayment.due_date).add(1, 'month').toDate();
  const nextPeriod = generatePeriodCovered(nextDueDate);

  await prisma.rent_payments.create({
    data: {
      id: uuidv4(),
      rental_agreement_id: agreement.id,
      tenant_id: userId,
      property_id: agreement.property_id,
      unit_id: agreement.unit_id,
      due_date: nextDueDate,
      due_amount: rentAmount,
      amount_paid: 0,
      method: null,
      transaction_id: null,
      period_covered: nextPeriod,
      status: 'pending',
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  return {
    next_due_date: nextDueDate.toISOString().split('T')[0],
  };

}

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
};
