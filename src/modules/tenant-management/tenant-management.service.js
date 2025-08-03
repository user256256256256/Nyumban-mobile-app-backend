import prisma from '../../prisma-client.js';

import {
    ValidationError,
    NotFoundError,
    AuthError,
    ForbiddenError,
    ServerError,
} from '../../common/services/errors-builder.service.js';

export const getTenants = async (landlordId) => {

  const agreements = await prisma.rental_agreements.findMany({
    where: {
      owner_id: landlordId,
      is_deleted: false,
      status: 'active',
    },
    include: {
      users_rental_agreements_tenant_idTousers: {
        select: {
          id: true,
          username: true,
          profile_picture_path: true,
        }
      },
      properties: {
        select: {
          property_name: true,
          has_units: true,
        }
      },
      property_units: {
        select: {
          id: true,
          unit_number: true,
        }
      },
      rent_payments: {
        where: { is_deleted: false },
        orderBy: { payment_date: 'desc' },
        take: 1
      }
    }
  });

  if (!agreements) throw new NotFoundError('Agreement not found', { field: 'Agreement ID'})

  return agreements.map((a) => {
    const latestPayment = a.rent_payments[0];

    return {
      tenant_id: a.tenant_id,
      user_id: a.users_rental_agreements_tenant_idTousers.id,
      name: a.users_rental_agreements_tenant_idTousers.username,
      user: {
        profile_picture_url: a.users_rental_agreements_tenant_idTousers.profile_picture_path,
      },
      property: {
        property_name: a.properties?.property_name || 'N/A',
      },
      unit: a.property_units
        ? {
            unit_id: a.property_units.id,
            unit_name: a.property_units.unit_number,
          }
        : null,
      agreement: {
        agreement_status: a.status,
        start_date: a.start_date
        
      },
      payment_info: {
        amount_due: latestPayment?.amount_due || 0,
        next_due_date: latestPayment?.due_date || null,
        date_rented: a.start_date, 
        rent_status: latestPayment?.payment_status || 'pending'
      }
    };
  });

}

export const getTenantRentHistory = async (
  tenantId,
  { limit = 20, cursor, month, year, status } = {}
) => {
  const where = {
    tenant_id: tenantId,
    is_deleted: false,
    ...(status && { status }),
  };

  // Filter by month/year if provided
  if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month
    where.payment_date = { gte: startDate, lte: endDate };
  } else if (year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);
    where.payment_date = { gte: startDate, lte: endDate };
  }

  // Fetch limit + 1 for pagination check
  const payments = await prisma.rent_payments.findMany({
    where,
    orderBy: { payment_date: 'desc' },
    take: Number(limit) + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    include: {
      properties: {
        select: {
          id: true,
          property_name: true,
        },
      },
      property_units: {
        select: {
          id: true,
          unit_number: true,
        },
      },
    },
  });

  const hasMore = payments.length > limit;
  const slicedPayments = payments.slice(0, limit);
  const nextCursor = hasMore ? slicedPayments[slicedPayments.length - 1].id : null;

  const formattedPayments = slicedPayments.map((payment) => ({
    payment_id: payment.id,
    property_id: payment.property_id,
    unit_id: payment.unit_id,
    property: {
      id: payment.property_id,
      property_name: payment.properties?.property_name || 'N/A',
    },
    unit: payment.property_units
      ? { id: payment.property_units.id, unit_number: payment.property_units.unit_number }
      : null,
    amount_paid: parseFloat(payment.amount_paid || 0),
    due_amount: parseFloat(payment.due_amount || 0),
    period_covered: payment.period_covered,
    payment_method: payment.method || 'N/A',
    payment_date: payment.payment_date,
    status: payment.status,
    notes: payment.notes || null,
  }));

  return {
    data: formattedPayments,
    nextCursor,
    hasMore,
    limit: Number(limit),
  };
};


export default {
  getTenants,
  getTenantRentHistory, 
}