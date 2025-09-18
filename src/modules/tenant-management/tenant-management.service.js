import prisma from '../../prisma-client.js';
import { triggerNotification } from '../notifications/notification.service.js';
import {
    ValidationError,
    NotFoundError,
    AuthError,
    ForbiddenError,
    ServerError,
} from '../../common/services/errors-builder.service.js';

export const getTenants = async (landlordId, { status } = {}) => {
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
        },
      },
      properties: {
        select: {
          property_name: true,
          has_units: true,
        },
      },
      property_units: {
        select: {
          id: true,
          unit_number: true,
        },
      },
      rent_payments: {
        where: {
          is_deleted: false,
          ...(status && { status }), // filter by payment status if provided
        },
        orderBy: { payment_date: 'desc' },
        take: 1, // latest payment
      },
    },
  });

  if (!agreements || agreements.length === 0) {
    throw new NotFoundError('No tenants found for this landlord', {
      field: 'landlordId',
    });
  }

  return agreements
    .map((agreement) => {
      const tenant = agreement.users_rental_agreements_tenant_idTousers;
      const unit = agreement.property_units;
      const latestPayment = agreement.rent_payments[0];

      // Skip tenant if status filter applied but no matching payment
      if (status && !latestPayment) return null;

      return {
        tenant_id: agreement.tenant_id,
        user_id: tenant.id,
        name: tenant.username,
        user: {
          profile_picture_url: tenant.profile_picture_path,
        },
        property: {
          property_name: agreement.properties?.property_name || 'N/A',
        },
        unit: unit
          ? {
              unit_id: unit.id,
              unit_name: unit.unit_number,
            }
          : null,
        agreement: {
          status: agreement.status,
          start_date: agreement.start_date,
        },
        payment_info: {
          amount_due: latestPayment?.due_amount || 0,
          next_due_date: latestPayment?.due_date || null,
          rent_status: latestPayment?.status || 'pending',
        },
      };
    })
    .filter(Boolean); 
};

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

export const sendRentReminders = async (landlordId, tenantIds = []) => {

  const results = [];

  for (const tenantId of tenantIds) {
    const agreement = await prisma.rental_agreements.findFirst({
      where: {
        tenant_id: tenantId,
        owner_id: landlordId,
        status: 'active',
        is_deleted: false,
      },
      include: {
        rent_payments: {
          where: { is_deleted: false },
          orderBy: { due_date: 'asc' },
          take: 1,
        },
        properties: { select: { property_name: true } },
      },
    });

    if (!agreement) {
      results.push({ tenantId, error: 'Tenant agreement not found' });
      continue;
    }

    const nextPayment = agreement.rent_payments[0];
    if (!nextPayment) {
      results.push({ tenantId, error: 'No upcoming payment found' });
      continue;
    }

    const message = `Your rent of UGX ${nextPayment.due_amount} is due on ${new Date(
      nextPayment.due_date
    ).toDateString()} for ${agreement.properties.property_name}.`;

    await triggerNotification(
      tenantId,
      'user',
      'Rent Reminder',
      message
    );

    results.push({
      tenantId,
      property_name: agreement.properties.property_name,
      due_amount: nextPayment.due_amount,
      due_date: nextPayment.due_date,
      message,
    });
  }

  return { total: results.length, reminders: results };
};

export default {
  getTenants,
  getTenantRentHistory, 
  sendRentReminders,
}