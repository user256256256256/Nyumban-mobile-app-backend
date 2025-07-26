import prisma from '../../prisma-client.js';

import {
    ValidationError,
    NotFoundError,
    AuthError,
    ForbiddenError,
    ServerError,
} from '../../common/services/errors.js';

export const getLandlordApplicationRequests = async (landlordId, status) => {
    const whereClause = {
      landlord_id: landlordId,
      is_deleted: false,
    };
  
    if (status) {
      whereClause.status = status;
    }
  
    const requests = await prisma.property_applications.findMany({
      where: whereClause,
      orderBy: { submitted_at: 'desc' },
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
  
    // Clean and format response
    return requests.map((app) => {
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
          name: tenantUser?.full_name || null,
          contact: tenantUser?.phone || tenantUser?.email || null,
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
};

export const resolveApplicationRequest = async (landlordId, applicationId, action, reason) => {
  const applicationRequest = await prisma.property_applications.findUnique({ 
    where: { id: applicationId },
    include: {
      properties: true
    } 
  });

  if (!applicationRequest) throw new NotFoundError('Application request not found', { field: 'Application Id' });
  if (applicationRequest.landlord_id !== landlordId) throw new AuthError('You are not authorized to resolve this application', { field: 'Landlord Id' })
  if (!applicationRequest.properties?.has_agreement) 
    throw new ValidationError('Attach agreement before resolving application', { field: `has_agreement: ${applicationRequest.properties?.has_agreement}`}) // Send notification here 
  if (applicationRequest.status !== 'pending') throw new ForbiddenError('Application request has already been resolved and cannot be modified', { field: 'Application Status' })

  const updated = await prisma.property_applications.update({
    where: { id: applicationId },
    data: {
      status: action === 'approved' ? 'approved' : 'rejected',
      landlord_message: action === 'rejected' ? reason : null,
      reviewed_at: new Date(),
    }
  })

  // 🔔 TODO: sendNotification(updated.user_id, status, reason) here

  return updated
}

export default {
  getLandlordApplicationRequests,
  resolveApplicationRequest,
};
