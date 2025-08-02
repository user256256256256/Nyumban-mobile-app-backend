import prisma from '../../prisma-client.js';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { simulateFlutterwaveRentPayment } from '../../common/services/flutterwave.service.js'
import {
  NotFoundError,
  AuthError,
  ServerError,
  ForbiddenError,
} from '../../common/services/errors-builder.service.js';

export const acceptAgreement = async (userId, agreementId, payload) => {
  const { accepted } = payload;
  if (!accepted) throw new AuthError('You must accept the agreement to proceed', { field: 'Accepted: true' });

  const agreement = await prisma.rental_agreements.findUnique({
    where: { id: agreementId },
    include: { users_rental_agreements_tenant_idTousers: true, properties: true }
  });

  if (!agreement) throw new NotFoundError('Agreement not found', { field: 'Agreement ID' });
  if (agreement.status !== 'ready') throw new ForbiddenError('Agreement is not yet ready for acceptance');
  if (agreement.tenant_id !== userId) throw new AuthError('You are not authorized to accept this agreement');
  if (agreement.tenant_accepted_agreement) throw new ForbiddenError('Agreement has already been accepted');

  const updatedAgreement = await prisma.rental_agreements.update({
    where: { id: agreementId },
    data: {
      tenant_accepted_agreement: true,
      updated_at: new Date(),
      status: 'completed',
    }
  });

  const propertyName = agreement.properties?.name || 'Property';

  // 🔔 Notification (non-blocking)
  void (async () => {
    try {
      await triggerNotification(
        agreement.owner_id,
        'AGREEMENT_ACCEPTED',
        'Agreement accepted by tenant',
        `Your agreement for ${propertyName} was accepted by the tenant.`
      );
    } catch (err) {
      console.error('Failed to notify landlord on agreement acceptance:', err);
    }
  })();

  return updatedAgreement;
};

export const processInitialRentPayment = async ({ userId, agreementId, payment_method, amount_paid }) => {
  const agreement = await prisma.rental_agreements.findUnique({
    where: { id: agreementId },
    include: { properties: true, property_units: true },
  });

  if (!agreement) throw new NotFoundError('Agreement not found', { field: 'Agreement ID' });
  if (agreement.tenant_id !== userId) throw new AuthError('Unauthorized to pay for this agreement', { field: 'User ID' });
  if (agreement.status !== 'pending_payment') {
    throw new ForbiddenError('Agreement must be in pending payment state before payment');
  }
  if (!agreement.tenant_accepted_agreement) {
    throw new ForbiddenError('Tenant must accept the agreement before making payment');
  }

  const rentAmount = parseFloat(agreement.properties?.price || 0);
  const securityDeposit = parseFloat(agreement.security_deposit || '0');
  const totalDue = rentAmount + securityDeposit;

  if (!rentAmount) throw new ServerError('Monthly rent amount not set for this property');
  if (amount_paid < totalDue) {
    throw new ForbiddenError(`Initial payment must be at least ${totalDue}.`);
  }

  const payment = await simulateFlutterwaveRentPayment({
    userId,
    agreementId,
    amount: amount_paid,
    metadata: { propertyId: agreement.property_id, unitId: agreement.unit_id },
  });

  const now = new Date();
  const periodCovered = generatePeriodCovered(now);

  // Record initial rent payment (full rent amount)
  const rentPaymentData = {
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
    type: 'rent',
    created_at: now,
    updated_at: now,
  };

  // Record security deposit payment (full deposit)
  const securityDepositData = {
    id: uuidv4(),
    rental_agreement_id: agreementId,
    tenant_id: userId,
    property_id: agreement.property_id,
    unit_id: agreement.unit_id,
    payment_date: now,
    due_date: now,
    amount_paid: securityDeposit,
    due_amount: securityDeposit,
    method: payment_method,
    transaction_id: payment.transaction_id,
    period_covered: null,
    status: 'completed',
    type: 'security_deposit',
    created_at: now,
    updated_at: now,
  };

  // Update agreement to active and set start_date
  const updateAgreement = prisma.rental_agreements.update({
    where: { id: agreementId },
    data: {
      status: 'active',
      start_date: now,
      updated_at: now,
    },
  });

  // Update property/unit status to occupied
  const updatePropertyStatus = agreement.properties.has_units
    ? prisma.property_units.update({ where: { id: agreement.unit_id }, data: { status: 'occupied' } })
    : prisma.properties.update({ where: { id: agreement.property_id }, data: { status: 'occupied' } });

  // Now allocate any excess amount towards future months (partial or full)

  let excessAmount = amount_paid - totalDue;
  let futureDueDate = dayjs(now).add(1, 'month');

  const futurePayments = [];

  while (excessAmount > 0) {
    const dueDate = futureDueDate.toDate();
    const period = generatePeriodCovered(futureDueDate);

    const amountToApply = Math.min(excessAmount, rentAmount);
    const status = amountToApply < rentAmount ? 'partially_paid' : 'completed';

    futurePayments.push(
      prisma.rent_payments.create({
        data: {
          id: uuidv4(),
          rental_agreement_id: agreementId,
          tenant_id: userId,
          property_id: agreement.property_id,
          unit_id: agreement.unit_id,
          due_date: dueDate,
          due_amount: rentAmount,
          amount_paid: amountToApply,
          method: payment_method,
          transaction_id: payment.transaction_id,
          period_covered: period,
          status,
          is_deleted: false,
          type: 'rent',
          created_at: now,
          updated_at: now,
        },
      })
    );

    excessAmount -= amountToApply;
    futureDueDate = futureDueDate.add(1, 'month');
  }

  // Run all DB ops in one transaction
  const [initialRentPayment, securityDepositPayment, , propertyStatusUpdate, ...futureRentPayments] = await prisma.$transaction([
    prisma.rent_payments.create({ data: rentPaymentData }),
    prisma.rent_payments.create({ data: securityDepositData }),
    updateAgreement,
    updatePropertyStatus,
    ...futurePayments,
  ]);

  const propertyName = agreement.properties?.property_name || 'Property';

  // 🔔 Notification (non-blocking)
  void (async () => {
    try {
      await triggerNotification(
        agreement.tenant_id,
        'RENT_PAYMENT_SUCCESS',
        'Initial rent payment successful',
        `Your initial rent and security deposit payment for ${propertyName} was successful.`
      );
    } catch (err) {
      console.error('Failed to send rent payment notification:', err);
    }
  })();

  return {
    rent_payment: initialRentPayment,
    security_deposit_payment: securityDepositPayment,
    future_payments: futureRentPayments,
    agreement_status: 'active',
  };
};




// Utility functions
function generatePeriodCovered(date = new Date()) {
  const d = dayjs(date);
  return `${d.year()}-${String(d.month() + 1).padStart(2, '0')}`;
}


export default {
  acceptAgreement,
  processInitialRentPayment, 
}


