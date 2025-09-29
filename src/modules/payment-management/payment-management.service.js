import prisma from '../../prisma-client.js';

import {
    ValidationError,
    NotFoundError,
    AuthError,
    ForbiddenError,
    ServerError,
} from '../../common/services/errors-builder.service.js';


export const getPayments = async (filters) => {
  const {
    paymentType,
    status,
    paymentMethod,
    offset = 0,
    limit = 20,
  } = filters;

  const where = {
    is_deleted: false,
    ...(paymentType && { payment_type: paymentType }),
    ...(status && { status }),
    ...(paymentMethod && { method: paymentMethod }),
  };

  const [totalRecords, payments] = await Promise.all([
    prisma.payments.count({ where }),
    prisma.payments.findMany({
      where,
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: { payment_date: 'desc' },
    }),
  ]);

  const formatted = payments.map((p) => ({
    paymentId: p.id,
    amountPaid: p.amount,
    currency: p.currency,
    paymentStatus: p.status,
    paymentMethod: p.method,
    datePaid: p.payment_date,
    transactionId: p.transaction_id,
    paymentType: p.payment_type,
    metadata: p.metadata,
  }));

  return {
    payments: formatted,
    pagination: {
      offset: parseInt(offset),
      limit: parseInt(limit),
      totalRecords,
    },
  };
};

export const getPayment = async (paymentId) => {
  const payment = await prisma.payments.findUnique({
    where: { id: paymentId },
  });

  if (!payment) throw new NotFoundError('Payment not found', { field: 'Payment ID'});
  return payment;
};

export default {
    getPayment,
    getPayments,
}