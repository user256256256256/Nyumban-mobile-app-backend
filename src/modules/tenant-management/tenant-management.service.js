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

export const getLatestTenantPayment = async (userId, agreementId) => {
  const agreement = await prisma.rental_agreements.findUnique({ 
    where: { id: agreementId }, 
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
          id: true,
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
        where: { is_deleted: false },
        orderBy: { payment_date: 'desc' },
        take: 1, // ✅ only fetch the latest
      },
    },
  });

  if (!agreement) {
    throw new NotFoundError('Agreement not found', { field: 'Agreement ID' });
  }

  if (agreement.owner_id !== userId && agreement.tenant_id !== userId) {
    throw new AuthError('Access denied', { field: 'User ID' });
  }

  // Extract parts
  const tenant = agreement.users_rental_agreements_tenant_idTousers || null;
  const unit = agreement.property_units || null;
  const latestPayment = agreement.rent_payments?.[0] || null;

  return {
    tenant_id: agreement.tenant_id,
    user_id: tenant?.id || null,
    name: tenant?.username || null,
    user: {
      profile_picture_url: tenant?.profile_picture_path || null,
    },
    property: {
      property_id: agreement.properties?.id || null,
      property_name: agreement.properties?.property_name || null,
    },
    unit: unit
      ? {
          unit_id: unit.id,
          unit_name: unit.unit_number,
        }
      : null,
    agreement: {
      id: agreement.id,
      status: agreement.status,
      start_date: agreement.start_date,
    },
    payment_info: latestPayment
      ? {
          payment_id: latestPayment.id,
          amount_due: latestPayment.due_amount,
          amount_paid: latestPayment.amount_paid,
          next_due_date: latestPayment.due_date,
          rent_status: latestPayment.status,
          payment_date: latestPayment.payment_date,
          payment_notes: latestPayment.notes,
          period_covered: latestPayment.period_covered,
          payment_date: latestPayment.payment_date
        }
      : null,
  };
};

export const getSecurityDeposits = async (userId, propertyId, status) => {
  const security_deposits = await prisma.security_deposits.findMany({
    where: {
      is_deleted: false,
      rental_agreement: {
        property_id: propertyId,
        owner_id: userId,
        is_deleted: false,
        ...(status && { status }),
      },
    },
    include: {
      rental_agreement: {
        select: {
          id: true,
          tenant_id: true,
          property_id: true,
          unit_id: true,
          users_rental_agreements_tenant_idTousers: {  // tenant relation
            select: {
              username: true,
              profile_picture_path: true,
            },
          },
          properties: {  // property relation
            select: {
              property_name: true,
            },
          },
          property_units: {  // unit info
            select: {
              unit_number: true,
            },
            where: {}, // optional filter by unit_id
          },
        },
      },
    },
    orderBy: { payment_date: 'desc' },
  });

  console.log("DEBUG:getSecurityDeposits", {
    userId,
    propertyId,
    status,
    resultsCount: security_deposits.length,
  });

  if (!security_deposits) throw new ServerError('Unknown error occurred');

  // Map to flat structure
  return security_deposits.map((sd) => ({
    id: sd.id,
    rental_agreement_id: sd.rental_agreement_id,
    amount: sd.amount,
    currency: sd.currency,
    payment_date: sd.payment_date,
    method: sd.method,
    status: sd.status,
    transaction_id: sd.transaction_id,
    notes: sd.notes,
    refunded_at: sd.refunded_at,
    tenant: {
      id: sd.rental_agreement.tenant_id,
      name: sd.rental_agreement.users_rental_agreements_tenant_idTousers?.[0]?.username || null,
      profile_picture: sd.rental_agreement.users_rental_agreements_tenant_idTousers?.[0]?.profile_picture_path || null,
    },
    property: {
      id: sd.rental_agreement.property_id,
      name: sd.rental_agreement.properties?.property_name || null,
    },
    unit: sd.rental_agreement.property_units?.[0]
      ? { unit_number: sd.rental_agreement.property_units[0].unit_number }
      : null,
  }));
};

export const getSecurityDeposit = async (securityDepositId) => {
  const security_deposit = await prisma.security_deposits.findFirst({
    where: {
      id: securityDepositId,
      is_deleted: false,
    },
    include: {
      rental_agreement: {
        select: {
          id: true,
          tenant_id: true,
          property_id: true,
          unit_id: true,
          users_rental_agreements_tenant_idTousers: { // <-- use the relation that points to the tenant user
            select: {
              username: true,
              profile_picture_path: true
            }
          },
          properties: {
            select: { property_name: true }
          },
          property_units: {
            select: { unit_number: true }
          }
        }
      }
    }
  });

  if (!security_deposit) {
    throw new NotFoundError('Security deposit not found', { field: 'Security Deposit ID' });
  }

  return security_deposit;
};

export const getTenantPaymentById = async (userId, paymentId) => {
  const payment = await prisma.rent_payments.findUnique({
    where: { id: paymentId },
    include: {
      rental_agreements: {
        include: {
          users_rental_agreements_tenant_idTousers: {
            select: { id: true, username: true, profile_picture_path: true },
          },
          properties: { select: { id: true, property_name: true, has_units: true } },
          property_units: { select: { id: true, unit_number: true } },
        },
      },
    },
  });

  if (!payment) throw new NotFoundError('Payment not found', { field: 'Payment ID' });

  const agreement = payment.rental_agreements;

  // Access control: landlord or tenant can view
  if (agreement.owner_id !== userId && agreement.tenant_id !== userId) {
    throw new AuthError('Access denied', { field: 'User ID' });
  }

  const tenant = agreement.users_rental_agreements_tenant_idTousers || null;
  const unit = agreement.property_units || null;

  return {
    tenant_id: agreement.tenant_id,
    user_id: tenant?.id || null,
    name: tenant?.username || null,
    user: { profile_picture_url: tenant?.profile_picture_path || null },
    property: {
      property_id: agreement.properties?.id || null,
      property_name: agreement.properties?.property_name || null,
    },
    unit: unit
      ? { unit_id: unit.id, unit_name: unit.unit_number }
      : null,
    agreement: {
      id: agreement.id,
      status: agreement.status,
      start_date: agreement.start_date,
    },
    payment_info: {
      payment_id: payment.id,
      amount_due: payment.due_amount,
      amount_paid: payment.amount_paid,
      next_due_date: payment.due_date,
      rent_status: payment.status,
      payment_date: payment.payment_date,
      payment_notes: payment.notes,
      period_covered: payment.period_covered,
      method: payment.method,
    },
  };
};


export default {
  getTenants,
  getTenantRentHistory, 
  sendRentReminders,
  getLatestTenantPayment,
  getSecurityDeposits,
  getSecurityDeposit,
  getTenantPaymentById
}