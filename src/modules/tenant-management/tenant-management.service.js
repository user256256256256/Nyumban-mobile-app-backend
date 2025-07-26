import prisma from '../../prisma-client.js';

import {
    ValidationError,
    NotFoundError,
    AuthError,
    ForbiddenError,
    ServerError,
} from '../../common/services/errors.js';

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

export const getTenantRentHistory = async (tenantId) => {
  const payments = await prisma.rent_payments.findMany({
    where: {
      tenant_id: tenantId,
      is_deleted: false,
    },
    orderBy: {
      payment_date: 'desc',
    },
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

  return payments.map(payment => {

    return {
      payment_id: payment.id,
      property_id: payment.property_id,
      unit_id: payment.unit_id,
      property: {
        property_name: payment.properties?.property_name || 'N/A',
      },
      unit: payment.property_units
        ? { unit_name: payment.property_units.unit_number }
        : null,
      amount_paid: payment.amount_paid,
      due_amount: payment.due_amount,
      period_covered: payment.period_covered,
      payment_method: payment.method || 'N/A',
      payment_date: payment.payment_date,
      status: payment.payment_status,
      notes: payment.notes || null,
    };
  });
};

export default {
  getTenants,
  getTenantRentHistory, 
}