import prisma from '../../prisma-client.js';
import { simulateFlutterwaveRentPayment } from '../../common/services/flutterwave.service.js';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

import {
  NotFoundError,
  AuthError,
  ServerError,
  ForbiddenError,
} from '../../common/services/errors-builder.service.js';

export const getPaymentHistory = async ({ userId, month, year, status, limit = 10, cursor }) => {
  const where = {
    tenant_id: userId,
    is_deleted: false,
    ...(status && { status }),
  };

  // Filter by month/year if provided
  if (month && year) {
    const startDate = new Date(year, month - 1, 1); // first day of month
    const endDate = new Date(year, month, 1);       // first day of next month
    endDate.setSeconds(endDate.getSeconds() - 1);   // subtract 1s → last second of previous day

    where.payment_date = { gte: startDate, lte: endDate };
  } else if (year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);
    endDate.setSeconds(endDate.getSeconds() - 1);

    where.payment_date = { gte: startDate, lte: endDate };
  }

  // Fetch one extra record for pagination
  const payments = await prisma.rent_payments.findMany({
    where,
    include: {
      properties: true,
      rental_agreements: true,
      property_units: true,
    },
    orderBy: { payment_date: 'desc' },
    take: Number(limit) + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  const hasMore = payments.length > limit;
  const slicedPayments = payments.slice(0, limit);
  const nextCursor = hasMore ? slicedPayments[slicedPayments.length - 1].id : null;

  return {
    results: slicedPayments.map((payment) => ({
      property_name: payment.properties?.property_name || 'N/A',
      unit: payment.property_units?.unit_number || '',
      period_covered: payment.due_date,
      payment_date: payment.payment_date?.toISOString(),
      amount_paid: parseFloat(payment.amount_paid || 0),
      method: payment.method || 'N/A',
      status: payment.status,
      notes: payment.notes || '',
      transaction_id: payment.transaction_id || '',
    })),
    nextCursor,
    hasMore,
  };
};

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
          unit_price: agreement.monthly_rent,
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
    monthly_rent_amount: parseFloat(agreement?.monthly_rent || agreement?.monthly_rent || 0),
    payment_due: !!nextDuePayment,
  };

};

export const getRentPosition = async ({ userId, propertyId, unitId }) => {
  // Find active rental agreement
  const whereClause = {
    tenant_id: userId,
    property_id: propertyId,
    is_deleted: false,
    status: 'active',
  };

  if (unitId) whereClause.unit_id = unitId;

  const agreement = await prisma.rental_agreements.findFirst({
    where: whereClause,
    include: {
      properties: true,
      property_units: true,
      users_rental_agreements_owner_idTousers: true,
      rent_payments: {
        where: { is_deleted: false },
        orderBy: { due_date: 'asc' }, // Ascending to find next due payment
      },
    },
  });

  if (!agreement) throw new NotFoundError('Active rental agreement not found');

  const unit = agreement.property_units;
  const landlord = agreement.users_rental_agreements_owner_idTousers;

  const allPayments = agreement.rent_payments;

  // Next due payment (pending or overdue)
  const nextDue = allPayments.find((p) =>
    ['pending', 'overdued'].includes(p.status)
  );

  // Last fully completed payment
  const lastPaid = [...allPayments].reverse().find((p) => p.status === 'completed');

  // Amounts and outstanding
  const rentAmount = parseFloat(nextDue?.due_amount || unit?.price || agreement.monthly_rent || 0);
  const amountPaid = parseFloat(nextDue?.amount_paid || 0);
  const outstanding = Math.max(0, rentAmount - amountPaid);

  // Determine payment status
  let status = 'upcoming';
  if (!nextDue) status = 'paid';
  else if (nextDue.status === 'overdued') status = 'overdue';
  else if (amountPaid > 0 && amountPaid < rentAmount) status = 'partially_paid';
  else if (amountPaid >= rentAmount) status = 'paid';

  // Days until next payment due
  const today = dayjs();
  const dueDate = nextDue?.due_date;
  const daysUntilDue = dueDate ? dayjs(dueDate).diff(today, 'day') : null;

  return {
    property: {
      id: agreement.property_id,
      name: agreement.properties?.property_name,
      thumbnail_url: agreement.properties?.thumbnail_image_path,
    },
    unit: unit
      ? {
          id: unit.id,
          number: unit.unit_number,
          monthly_rent: parseFloat(agreement.monthly_rent || unit.price || 0),
        }
      : null,
    landlord: landlord
      ? {
          id: landlord.id,
          name: landlord.full_name,
          contact_phone: landlord.phone_number,
          contact_email: landlord.email,
        }
      : null,
    lease_start_date: agreement.start_date?.toISOString().split('T')[0],
    next_payment: nextDue
      ? {
          id: nextDue.id,
          due_date: dueDate?.toISOString().split('T')[0],
          amount_due: rentAmount,
          amount_paid: amountPaid,
          outstanding_balance: outstanding,
          status,
          period_covered: nextDue.period_covered,
        }
      : null,
    last_payment: lastPaid
      ? {
          id: lastPaid.id,
          amount: parseFloat(lastPaid.amount_paid),
          date: lastPaid.payment_date.toISOString().split('T')[0],
        }
      : null,
    days_until_due: daysUntilDue,
    agreement_status: agreement.status,
    payment_due: !!nextDue,
    can_pay_advance: true,
    max_months_advance: 6,
  };
};

export const getRentAndDeposit = async ({ userId, propertyId, unitId }) => {
  // Check if user has an active agreement for this property/unit
  const agreement = await prisma.rental_agreements.findFirst({
    where: {
      tenant_id: userId,
      property_id: propertyId,
      is_deleted: false,
      status: { in: ['active', 'completed'] },
      ...(unitId ? { unit_id: unitId } : {}),
    },
    include: {
      properties: true,
      property_units: true,
    },
  });

  if (!agreement) {
    throw new NotFoundError('Rental agreement not found for this property (and unit)', { field: 'Property ID or User ID'});
  }

  // Determine monthly rent
  const monthlyRent = parseFloat(
    agreement.property_units?.price ??
    agreement.properties?.price ??
    0
  );

  // Security deposit for this agreement
  const securityDeposit = parseFloat(agreement.security_deposit ?? 0);

  return {
    monthly_rent: monthlyRent,
    security_deposit: securityDeposit,
  };
};

export default {
  getCurrentRentalDetails,
  getPaymentHistory,
  getRentAndDeposit,
  getRentPosition,
};