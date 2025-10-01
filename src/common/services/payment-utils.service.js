import prisma from '../../prisma-client.js';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { formatPeriodString, buildPeriodObject } from '../utils/generate-rent-period.util.js';

import {
  NotFoundError,
  AuthError,
  ForbiddenError,
  ServerError,
} from '../../common/services/errors-builder.service.js';

/**
 * Validate agreement and return it
 */
export async function validateAgreementManualPayment(landlordId, agreementId) {
  const agreement = await prisma.rental_agreements.findUnique({ where: { id: agreementId } });
  if (!agreement) throw new NotFoundError('Agreement not found', { field: 'Agreement ID' });
  if (agreement.status !== 'active') throw new AuthError('Agreement is not active', { field: 'Agreement ID' });
  if (agreement.owner_id !== landlordId) throw new ForbiddenError('Unauthorized landlord', { field: 'Landlord ID' });

  const monthlyRent = parseFloat(agreement.monthly_rent?.toString() || '0');
  if (!monthlyRent || monthlyRent <= 0) throw new ServerError('Monthly rent invalid for agreement.');
  return agreement;
}

export async function validateAgreementIntialRentPayment(landlordId, agreementId) {
  const agreement = await prisma.rental_agreements.findUnique({ where: { id: agreementId } });
  if (!agreement) throw new NotFoundError('Agreement not found', { field: 'Agreement ID' });
  if (agreement.owner_id !== landlordId) throw new ForbiddenError('Unauthorized landlord', { field: 'Landlord ID' });
  if (agreement.status !== 'pending_payment') throw new AuthError('Agreement is already active cannot make intial rent payment', { field: 'Agreement ID' });
  if (!agreement.tenant_accepted_agreement) throw new ForbiddenError('Tenant must accept the agreement before payment');

  const monthlyRent = parseFloat(agreement.monthly_rent?.toString() || '0');
  if (!monthlyRent || monthlyRent <= 0) throw new ServerError('Monthly rent invalid for agreement.');
  return agreement;
}

export async function validateTenantAgreementInitialPayment(tenantId, agreementId, options) {
  const agreement = await prisma.rental_agreements.findUnique({
    where: { id: agreementId },
    ...options,
  });
  if (!agreement) throw new NotFoundError('Agreement not found', { field: 'Agreement ID' });
  if (agreement.tenant_id !== tenantId) throw new AuthError('Unauthorized tenant', { field: 'Tenant ID' });
  if (agreement.status !== 'pending_payment') throw new ForbiddenError('Agreement is not pending payment');
  if (!agreement.tenant_accepted_agreement) throw new ForbiddenError('Tenant must accept the agreement first');

  return agreement;
}

export async function validateAgreement(tenantId, agreementId) {
  const agreement = await prisma.rental_agreements.findUnique({
    where: { id: agreementId },
  });

  if (!agreement) {
    throw new NotFoundError('Agreement not found', { field: 'Agreement ID' });
  }

  if (agreement.status !== 'active') {
    throw new AuthError('Agreement is not active', { field: 'Agreement ID' });
  }

  if (agreement.tenant_id !== tenantId) {
    throw new ForbiddenError('Unauthorized tenant', { field: 'Tenant ID' });
  }
  const monthlyRent = parseFloat(agreement.monthly_rent?.toString() || '0');
  if (!monthlyRent || monthlyRent <= 0) {
    throw new ServerError('Monthly rent invalid for agreement.');
  }

  return agreement;
}



/**
 * Fetch unpaid or partial rent payments for a tenant
 */
export async function fetchPendingDues(tenantId) {
  return prisma.rent_payments.findMany({
    where: { tenant_id: tenantId, status: { in: ['pending', 'overdued', 'partial'] }, is_deleted: false },
    orderBy: { due_date: 'asc' },
  });
}

/**
 * Determine last due date for payment allocation
 */
export async function determineLastDueDate(tenantId, duePayments, agreement) {
  if (duePayments.length) return duePayments[duePayments.length - 1].due_date;
  const lastPaymentRecord = await prisma.rent_payments.findFirst({
    where: { tenant_id: tenantId, is_deleted: false },
    orderBy: { due_date: 'desc' },
  });
  return lastPaymentRecord?.due_date || agreement.start_date || new Date();
}


/**
 * Determine final status and notification type
 */
export function determineStatusAndType(lastPayment, remaining, completedCount, duePayments) {
  let paymentType;
  if (completedCount > 0 && remaining <= 0) {
    if (duePayments.length === 0 && lastPayment?.status === 'completed') paymentType = 'advance';
    else paymentType = 'paid';
  } else {
    paymentType = 'partial';
  }
  const status = lastPayment?.status || (completedCount > 0 ? 'completed' : 'partial');
  return { status, paymentType };
}
