import prisma from '../../prisma-client.js';
import { triggerNotification } from '../notifications/notification.service.js';

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
    is_deleted_by_landlord: false,
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
      users_property_applications_tenant_idTousers: {
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
    const tenantUser = app.users_property_applications_tenant_idTousers; // ✅ correct
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

export const resolveApplicationRequest = async (landlordId, applicationId, action, reason, skipStatusCheck = false) => {
  const applicationRequest = await prisma.property_applications.findUnique({
    where: { id: applicationId },
    include: {
      properties: { select: { id: true, owner_id: true, has_agreement: true, has_units: true, property_name: true } },
      property_units: { select: { id: true, is_deleted: true, status: true } },
    }
  });

  if (!applicationRequest) throw new NotFoundError('Application request not found', { field: 'Application ID' });
  if (applicationRequest.landlord_id !== landlordId) throw new AuthError('You are not authorized to resolve this application', { field: 'Landlord Id' });
  if (!applicationRequest.properties?.has_agreement) {
    throw new ValidationError('Attach agreement before resolving application', { field: `has_agreement: ${applicationRequest.properties?.has_agreement}` });
  }
  if (!skipStatusCheck && applicationRequest.status !== 'pending') {
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

  // Update application status
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
        where: {
          property_id: applicationRequest.property_id,
          ...(applicationRequest.properties.has_units
            ? { unit_id: applicationRequest.unit_id }
            : { unit_id: null }),
        },
      });
      
      if (!agreement) throw new NotFoundError('No rental agreement found for this property', { field: 'Agreement' });
      if (agreement.tenant_id && !skipStatusCheck) throw new ForbiddenError('This agreement already has a tenant assigned', { field: 'Tenant ID' });

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
  const propertyName = applicationRequest.properties?.property_name || 'the property';
  void (async () => {
    try {
      if (action === 'approved') {
        await triggerNotification(
          updated.tenant_id,
          'user',
          'Your Application Has Been Approved',
          `Good news! Your application for ${propertyName} has been approved. Please proceed with payment to finalize the agreement.`
        );
      } else {
        await triggerNotification(
          updated.tenant_id,
          'user',
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

export const orchestrateApplicationResolution = async (landlordId, applicationId, action, reason) => {
  return prisma.$transaction(async (tx) => {
    const application = await tx.property_applications.findUnique({ where: { id: applicationId }, include: { properties: true, property_units: true} })
    if (!application) throw new NotFoundError('Application not found', { field: 'Application ID' })

    if (action === 'approved') {
      // Find another *already approved* application for this property/unit
      const existingApproved = await tx.property_applications.findFirst({
        where: {
          property_id: application.property_id,
          status: 'approved',
          ...(application.properties.has_units
            ? { unit_id: application.unit_id }
            : { unit_id: null }),
        },
        include: { properties: true, property_units: true },
      });

      // Rollback only if a different application is already approved
      if (existingApproved && existingApproved.id !== application.id) {
        await rollbackPropertyReservation(tx, existingApproved);
      }
    }

    return resolveApplicationRequest(landlordId, applicationId, action, reason, true)
    
  })
}

const rollbackPropertyReservation = async (tx, existingReserved) => {
  if (!existingReserved) throw new ServerError('Unknown error occurred', { field: 'Existing reserved property' });

  // Get the exact agreement tied to this property/unit
  const agreement = await tx.rental_agreements.findFirst({
    where: {
      property_id: existingReserved.property_id,
      ...(existingReserved.properties.has_units
        ? { unit_id: existingReserved.unit_id }
        : { unit_id: null }),
      tenant_id: existingReserved.tenant_id, // 👈 ensures you fetch the right agreement
    },
  });

  if (!agreement) throw new NotFoundError('No rental agreement found for rollback');

  // Clear tenant assignment
  await tx.rental_agreements.update({
    where: { id: agreement.id },
    data: { tenant_id: null, status: 'ready' },
  });

  // Reset property/unit availability
  if (existingReserved.properties.has_units) {
    await tx.property_units.update({
      where: { id: existingReserved.property_units.id },
      data: { status: 'available' },
    });
  } else {
    await tx.properties.update({
      where: { id: existingReserved.property_id },
      data: { status: 'available' },
    });
  }

  // Reject the old application
  await tx.property_applications.update({
    where: { id: existingReserved.id },
    data: {
      status: 'rejected',
      landlord_message: 'Your reservation is canceled for new approval',
      reviewed_at: new Date(),
    },
  });

  void triggerNotification(
    existingReserved.tenant_id,
    'user',
    'Reservation Canceled',
    'Your reservation was cancelled by the landlord to approve a new applicant.'
  );
};

export const deleteApplicationRequests = async (landlordId, applicationIds = []) => {
  const updates = [];
  const notifications = [];

  for (const applicationId of applicationIds) {
    const application = await prisma.property_applications.findUnique({ 
      where: { id: applicationId },
      include: {
        properties: {
          select: {
            property_name: true,
            has_units: true,
          },
        },
        property_units: {
          select: {
            unit_number: true,
          },
        },
      },
    });

    if (!application) continue;
    if (application.landlord_id !== landlordId) continue; // unauthorized

    if (application.status === 'pending') {
      // Decline + delete
      updates.push(
        prisma.property_applications.update({
          where: { id: applicationId },
          data: {
            status: 'rejected',
            is_deleted_by_landlord: true,
            reviewed_at: new Date(),
          },
        })
      );

      const displayName = application.properties.has_units
        ? `${application.properties.property_name} - Unit ${application.property_units?.unit_number}`
        : application.properties.property_name;

      notifications.push(
        triggerNotification(
          application.tenant_id,
          'user',
          'Application Request Declined',
          `Your tour request for property ${displayName} has been declined.`
        )
      );
    } else {
      // Already resolved → just mark as deleted
      updates.push(
        prisma.property_applications.update({
          where: { id: applicationId },
          data: {
            is_deleted_by_landlord: true,
            reviewed_at: new Date(),
          },
        })
      );
    }
  }

  // Apply DB updates
  const results = await prisma.$transaction(updates);

  // Fire notifications asynchronously
  void Promise.all(
    notifications.map((n) =>
      n.catch((err) =>
        console.error(`Failed to send notification for request:`, err)
      )
    )
  );

  return {
    deleted: results.map((a) => ({
      applicationId: a.id,
      status: a.status,
      is_deleted_by_landlord: a.is_deleted_by_landlord,
    })),
    deleted_applications: `${results.length} application(s) marked as deleted`,
  };
};

export default {
  resolveApplicationRequest,
  getLandlordApplicationRequests,
  deleteApplicationRequests,
  orchestrateApplicationResolution
}