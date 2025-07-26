import prisma from '../../prisma-client.js';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { simulateFlutterwaveRentPayment } from '../../common/services/flutterwave.service.js'
import {
  NotFoundError,
  AuthError,
  ServerError,
  ForbiddenError,
} from '../../common/services/errors.js';

export const acceptAgreement = async (userId, agreementId, payload) => {
  const { accepted } = payload;
  if (!accepted) throw new AuthError('You must accept the ageement to proceed', { field: 'Accepted: true'})
  
  const agreement = await prisma.rental_agreements.findUnique({ 
    where: { id: agreementId },
    include: { users_rental_agreements_tenant_idTousers: true }
  })

  if (!agreement) throw new NotFoundError('Agreement not found', { field: 'Agreement ID'} )
  
  if (agreement.status !== 'ready') throw new ForbiddenError('Agreement is not yet ready for acceptance');

  if (agreement.tenant_id !== userId)   throw new AuthError('You are not authorized to accept this agreement');

  if (agreement.tenant_accepted_agreement) throw new ForbiddenError('Agreement has already been accepted');

  const updatedAgreement = await prisma.rental_agreements.update({
    where: { id: agreementId }, 
    data: {
      tenant_accepted_agreement: true,
      updated_at: new Date(),
      status: 'completed',
    }
  })

  return updatedAgreement;
}

export const processInitialRentPayment = async ({ userId, agreementId, payment_method }) => {
  const agreement = await prisma.rental_agreements.findUnique({
    where: { id: agreementId },
    include: {
      properties: true,
      property_units: true,
    },
  });

  if (!agreement) throw new NotFoundError('Agreement not found', { field: 'Agreement ID' });
  if (agreement.tenant_id !== userId) throw new AuthError('Unauthorized to pay for this agreement', { field: 'User ID' });
  if (!agreement.tenant_accepted_agreement) {
    throw new ForbiddenError('Tenant must accept the agreement before making payment');
  }

  const rentAmount = parseFloat(agreement.properties?.price || 0);
  if (!rentAmount) throw new ServerError('Monthly rent amount not set for this property');

  const payment = await simulateFlutterwaveRentPayment({
    userId,
    agreementId,
    amount: rentAmount,
    metadata: {
      propertyId: agreement.property_id,
      unitId: agreement.unit_id,
    },
  });

  const now = new Date();
  const nextDueDate = dayjs(now).add(1, 'month').toDate();
  const periodCovered = generatePeriodCovered(now);
  const nextPeriod = generatePeriodCovered(nextDueDate);

  const [initialPayment, _agreementUpdate, _nextDue] = await prisma.$transaction([
    // Completed payment record
    prisma.rent_payments.create({
      data: {
        id: uuidv4(),
        rental_agreement_id: agreementId,
        tenant_id: userId,
        property_id: agreement.property_id,
        unit_id: agreement.unit_id,
        payment_date: now,
        due_date: now,
        amount_paid: rentAmount,
        due_amount: rentAmount,
        method: payment_method,
        transaction_id: payment.transaction_id,
        period_covered: periodCovered,
        status: 'completed',
        created_at: now,
        updated_at: now,
      },
    }),

    // Activate agreement
    prisma.rental_agreements.update({
      where: { id: agreementId },
      data: {
        status: 'active',
        start_date: now,
        end_date: addMonthsToDate(now, 12),
        updated_at: now,
      },
    }),

    // Create next due rent
    prisma.rent_payments.create({
      data: {
        id: uuidv4(),
        rental_agreement_id: agreementId,
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
        created_at: now,
        updated_at: now,
      },
    }),
  ]);

  return {
    rent_payment: initialPayment,
    next_due_date: nextDueDate,
    agreement_status: 'active',
  };
};

// Utility functions
function addMonthsToDate(date, months) {
  return dayjs(date).add(months, 'month').toDate();
}

function generatePeriodCovered(date = new Date()) {
  const d = dayjs(date);
  return `${d.year()}-${String(d.month() + 1).padStart(2, '0')}`;
}


export default {
  acceptAgreement,
  processInitialRentPayment, 
}

