import prisma from '../../prisma-client.js';

import {
    ValidationError,
    NotFoundError,
    AuthError,
    ForbiddenError,
    ServerError,
} from '../../common/services/errors-builder.service.js';

export const getLandlordApplicationRequests = async (landlordId, { status, cursor, limit = 20 }) => {
  const whereClause = {
    landlord_id: landlordId,
    is_deleted: false,
    ...(status && { status }),
  };

  const requests = await prisma.property_applications.findMany({
    where: whereClause,
    orderBy: { submitted_at: 'desc' },
    take: Number(limit) + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: {
      id: true,
      tenant_message: true,
      status: true,
      landlord_message: true,
      submitted_at: true,
      reviewed_at: true,
      properties: {
        select: {
          id: true,
          property_name: true,
          thumbnail_image_path: true,
          has_agreement: true,
          has_units: true,
        },
      },
      property_units: {
        select: {
          id: true,
          unit_number: true,
        },
      },
      users_property_applications_user_idTousers: {
        select: {
          id: true,
          username: true,
          phone_number: true,
          email: true,
          tenant_profiles: {
            select: {
              full_names: true,
              employment_status: true,
              occupation: true,
              emergency_contact_name: true,
              emergency_contact_phone: true,
              monthly_income: true,
            },
          },
        },
      },
    },
  });

  const data = requests.slice(0, limit).map((app) => {
    const tenantUser = app.users_property_applications_user_idTousers;
    const profile = tenantUser?.tenant_profiles;

    return {
      application_id: app.id,
      status: app.status,
      tenant_message: app.tenant_message,
      landlord_message: app.landlord_message,
      submitted_at: app.submitted_at,
      reviewed_at: app.reviewed_at,
      tenant: {
        tenant_id: tenantUser?.id || null,
        name: tenantUser?.username || null,
        contact: tenantUser?.phone_number || tenantUser?.email || null,
      },
      application_details: {
        name: profile?.full_names || null,
        'employment-status': profile?.employment_status || null,
        occupation: profile?.occupation || null,
        'emergency-contact-name': profile?.emergency_contact_name || null,
        'emergency-contact-phone': profile?.emergency_contact_phone || null,
        'monthly-income': profile?.monthly_income || null,
      },
      property: {
        property_id: app.properties?.id || null,
        name: app.properties?.property_name || null,
        thumbnail_url: app.properties?.thumbnail_image_path || null,
        has_units: app.properties?.has_units,
      },
      unit: app.property_units
        ? {
            unit_id: app.property_units.id,
            name: app.property_units.unit_number,
          }
        : null,
      agreement_attached: !!app.properties?.has_agreement,
    };
  });

  const nextCursor = requests.length > limit ? requests[limit].id : null;

  return {
    results: data,
    nextCursor,
    hasMore: Boolean(nextCursor),
  };
};


export const resolveApplicationRequest = async (landlordId, applicationId, action, reason) => {
  const applicationRequest = await prisma.property_applications.findUnique({
    where: { id: applicationId },
    include: {
      properties: { select: { id: true, owner_id: true, has_agreement: true, has_units: true, title: true } },
      property_units: { select: { id: true, is_deleted: true, status: true } },
    }
  });

  if (!applicationRequest) throw new NotFoundError('Application request not found', { field: 'Application ID' });
  if (applicationRequest.landlord_id !== landlordId) throw new AuthError('You are not authorized to resolve this application', { field: 'Landlord Id' });
  if (!applicationRequest.properties?.has_agreement) {
    throw new ValidationError('Attach agreement before resolving application', { field: `has_agreement: ${applicationRequest.properties?.has_agreement}` });
  }
  if (applicationRequest.status !== 'pending') {
    throw new ForbiddenError('Application request has already been resolved', { field: 'Application Status' });
  }

  if (applicationRequest.properties.has_units) {
    if (!applicationRequest.property_units) {
      throw new NotFoundError('Application references a unit, but no unit found', { field: 'Unit ID' });
    }
    if (applicationRequest.property_units.is_deleted || applicationRequest.property_units.status !== 'available') {
      throw new ForbiddenError('Unit is not available for approval', { field: 'Unit status' });
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedApplication = await tx.property_applications.update({
      where: { id: applicationId },
      data: {
        status: action === 'approved' ? 'approved' : 'rejected',
        landlord_message: action === 'rejected' ? reason : null,
        reviewed_at: new Date(),
      }
    });

    if (action === 'approved') {
      const agreement = await tx.rental_agreements.findFirst({
        where: { property_id: applicationRequest.property_id }
      });

      if (!agreement) throw new NotFoundError('No rental agreement found for this property', { field: 'Agreement' });
      if (agreement.tenant_id) throw new ForbiddenError('This agreement already has a tenant assigned', { field: 'tenant_id' });

      await tx.rental_agreements.update({
        where: { id: agreement.id },
        data: { tenant_id: applicationRequest.tenant_id, status: 'pending_payment' }
      });

      if (applicationRequest.properties.has_units) {
        await tx.property_units.update({
          where: { id: applicationRequest.property_units.id },
          data: { status: 'reserved' }
        });
      } else {
        await tx.properties.update({
          where: { id: applicationRequest.property_id },
          data: { status: 'reserved' }
        });
      }

      await tx.property_applications.updateMany({
        where: {
          property_id: applicationRequest.property_id,
          id: { not: applicationId },
          status: 'pending',
          ...(applicationRequest.properties.has_units ? { unit_id: applicationRequest.unit_id } : {}),
        },
        data: {
          status: 'rejected',
          landlord_message: 'Application rejected: another tenant was approved',
          reviewed_at: new Date(),
        }
      });
    }

    return updatedApplication;
  });

  // 🔔 Notify tenant about the decision
  const propertyName = applicationRequest.properties?.title || 'the property';
  void (async () => {
    try {
      if (action === 'approved') {
        await triggerNotification(
          updated.tenant_id,
          'APPLICATION_APPROVED',
          'Your Application Has Been Approved',
          `Good news! Your application for ${propertyName} has been approved. Please proceed with payment to finalize the agreement.`
        );
      } else {
        await triggerNotification(
          updated.tenant_id,
          'APPLICATION_REJECTED',
          'Your Application Has Been Rejected',
          reason || `Unfortunately, your application for ${propertyName} has been rejected.`
        );
      }
    } catch (err) {
      console.error(`Failed to send notification for application ${applicationId}:`, err);
    }
  })();

  return updated;
};





export default {
  resolveApplicationRequest,
  getLandlordApplicationRequests,
}