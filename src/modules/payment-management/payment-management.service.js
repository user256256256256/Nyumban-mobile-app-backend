import prisma from '../../prisma-client.js';

import {
    ValidationError,
    NotFoundError,
    AuthError,
    ForbiddenError,
    ServerError,
} from '../../common/services/errors.js';

export const getRentPayments = async (landlordId, filters) => {
  const {
    propertyId,
    unitId,
    tenantId,
    status,
    paymentMethod,
    startDate,
    endDate,
    offset = 0,
    limit = 20,
  } = filters;

  const where = {
    is_deleted: false,
    ...(propertyId && { property_id: propertyId }),
    ...(unitId && { unit_id: unitId }),
    ...(tenantId && { tenant_id: tenantId }),
    ...(status && { status }),
    ...(paymentMethod && { method: paymentMethod }),
    ...(startDate && { payment_date: { gte: new Date(startDate) } }),
    ...(endDate && { payment_date: { lte: new Date(endDate) } }),
    rental_agreements: {
      owner_id: landlordId, // ✅ no `some` needed here
    },
  };

  const [totalRecords, payments] = await Promise.all([
    prisma.rent_payments.count({ where }),
    prisma.rent_payments.findMany({
      where,
      take: parseInt(limit),
      skip: parseInt(offset),
      include: {
        rental_agreements: {
          include: {
            properties: {
              select: {
                id: true,
                property_name: true,
                thumbnail_image_path: true,
              },
            },
            property_units: {
              select: {
                id: true,
                unit_number: true,
              },
            },
            users_rental_agreements_tenant_idTousers: {
              select: {
                username: true,
              },
            },
          },
        },
      },
      orderBy: { payment_date: 'desc' },
    }),
  ]);
  

  const formatted = payments.map((p) => ({
    paymentId: p.id,
    propertyId: p.property_id,
    unitId: p.unit_id,
    tenantId: p.tenant_id,
    amountPaid: p.amount_paid,
    currency: p.currency,
    paymentStatus: p.status,
    paymentMethod: p.method,
    datePaid: p.payment_date,
    periodCovered: p.period_covered,
    transactionId: p.transaction_id,
    notes: p.notes || null,
    manualEntry: p.method === 'manual',
    property: {
      propertyId: p.rental_agreements?.properties?.id,
      propertyName: p.rental_agreements?.properties?.property_name,
      thumbnail: p.rental_agreements?.properties?.thumbnail_image_path,
    },
    unit: {
      unitId: p.rental_agreements?.property_units?.id,
      unitName: p.rental_agreements?.property_units?.unit_number,
    },
    tenant: {
      tenantName:
        p.rental_agreements?.users_rental_agreements_tenant_idTousers?.full_name,
    },
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


export const getRentPayment = async (paymentId) => {
  const payment = await prisma.rent_payments.findFirst({
    where: {
      id: paymentId,
      is_deleted: false,
    },
    include: {
      rental_agreements: {
        include: {
          properties: {
            select: {
              id: true,
              property_name: true,
              thumbnail_image_path: true,
            },
          },
          property_units: {
            select: {
              id: true,
              unit_number: true,
            },
          },
          users_rental_agreements_tenant_idTousers: {
            select: {
              username: true,
            },
          },
        },
      },
    },
  });

  if (!payment) throw new NotFoundError('Payment not found', { field: 'Payment ID' });

  // You may format the result here too if needed
  return {
    paymentId: payment.id,
    propertyId: payment.property_id,
    unitId: payment.unit_id,
    tenantId: payment.tenant_id,
    amountPaid: payment.amount_paid,
    currency: payment.currency,
    paymentStatus: payment.status,
    paymentMethod: payment.method,
    datePaid: payment.payment_date,
    periodCovered: payment.period_covered,
    transactionId: payment.transaction_id,
    notes: payment.notes || null,
    manualEntry: payment.method === 'manual',
    property: {
      propertyId: payment.rental_agreements?.properties?.id,
      propertyName: payment.rental_agreements?.properties?.property_name,
      thumbnail: payment.rental_agreements?.properties?.thumbnail,
    },
    unit: {
      unitId: payment.rental_agreements?.property_units?.id,
      unitName: payment.rental_agreements?.property_units?.unit_name,
    },
    tenant: {
      tenantName: payment.rental_agreements?.users_rental_agreements_tenant_idTousers?.full_name,
    },
  };
};

export const getPayments = async (filters) => {
  const {
    paymentType,
    status,
    paymentMethod,
    startDate,
    endDate,
    offset = 0,
    limit = 20,
  } = filters;

  const where = {
    is_deleted: false,
    ...(paymentType && { payment_type: paymentType }),
    ...(status && { status }),
    ...(paymentMethod && { method: paymentMethod }),
    ...(startDate && { payment_date: { gte: new Date(startDate) } }),
    ...(endDate && { payment_date: { lte: new Date(endDate) } }),
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
    getRentPayments,
    getRentPayment,

}