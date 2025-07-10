import prisma from '../../prisma-client.js';
import { v4 as uuidv4 } from 'uuid';

import {
    ValidationError,
    NotFoundError,
    AuthError,
    ForbiddenError,
    ServerError,
} from '../../common/services/errors.js';

export const applicationRequest = async (payload, userId) => {
  const {
    propertyId,
    unitId,
    employmentStatus,
    occupation,
    emergencyContactPhone,
    emergencyContactName,
    monthlyIncome,
    tenantMessage
  } = payload;

  // 1. Check if property exists and is available
  const property = await prisma.properties.findFirst({
    where: { id: propertyId, is_deleted: false }
  });

  if (!property) {
    throw new NotFoundError('Property not found');
  }

  // 2. If property has units, unitId must be specified
  if (property.has_units && !unitId) {
    throw new ForbiddenError('You have to specify a unit ID, this property has units');
  }

  // 3. Prevent duplicate active applications for the same property/unit
  const existingApplication = await prisma.property_applications.findFirst({
    where: {
      property_id: propertyId,
      unit_id: property.has_units ? unitId : null,
      user_id: userId,
      status: { in: ['pending', 'approved'] },
      is_deleted: false,
    }
  });

  if (existingApplication) {
    throw new AuthError('You already have an active application for this property/unit');
  }

  const landlordId = property.owner_id;

  // 4. Upsert missing tenant profile fields (only update missing)
  const existingProfile = await prisma.tenant_profiles.findUnique({
    where: { user_id: userId }
  });

  if (existingProfile) {
    const updateData = {};

    if (!existingProfile.employment_status && employmentStatus) {
      updateData.employment_status = employmentStatus;
    }
    if (!existingProfile.occupation && occupation) {
      updateData.occupation = occupation;
    }
    if (!existingProfile.emergency_contact_phone && emergencyContactPhone) {
      updateData.emergency_contact_phone = emergencyContactPhone;
    }
    if (!existingProfile.emergency_contact_name && emergencyContactName) {
      updateData.emergency_contact_name = emergencyContactName;
    }
    if (!existingProfile.monthly_income && monthlyIncome) {
      updateData.monthly_income = monthlyIncome;
    }

    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date();
      await prisma.tenant_profiles.update({
        where: { user_id: userId },
        data: updateData
      });
    }
  }

  // 5. Create the application
  const application = await prisma.property_applications.create({
    data: {
      id: uuidv4(),
      property_id: propertyId,
      unit_id: property.has_units ? unitId : null,
      user_id: userId,
      landlord_id: landlordId,
      status: 'pending',
      tenant_message: tenantMessage || null,
      submitted_at: new Date()
    }
  });

  return { application };
};

export const getApplicationRequest = async(userId) => {
  const applications = await prisma.property_applications.findMany({
    where: {
      user_id: userId,
      is_deleted: false,
    },
    orderBy: {
      submitted_at: 'desc',
    },
    include: {
      properties: {
        select: {
          id: true,
          property_name: true,
          thumbnail_image_path: true,
          has_units: true,
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

  return applications.map(app => ({
    application_id: app.id,
    property_id: app.property_id,
    property_name: app.properties?.property_name || null,
    thumbnail_url: app.properties?.thumbnail_image_path || null,
    unit_id: app.unit_id || null,
    unit_number: app.property_units?.unit_number || null,
    status: app.status,
    submitted_at: app.submitted_at,
  }));
}

export const cancelApplication = async (userId, applicationId) => {
  const application = await prisma.property_applications.findFirst({
    where: {
      id: applicationId,
      user_id: userId,
      is_deleted: false
    },
  })

  if (!application) throw new NotFoundError('Application not found')

  if (application.status !== 'pending') throw new ValidationError('Application cannot be cancelled after approval or rejection', {field: 'Application Id'})

  const updated = await prisma.property_applications.update({
    where: { id: applicationId },
    data: {
      status: 'cancelled',
      is_deleted: true,
      deleted_at: new Date(),
    },
  })

  return {
    message: 'Application cancelled and removed',
    application_id: updated.id,
    status: updated.status,
  }
}

export default {
  applicationRequest,
  getApplicationRequest,
  cancelApplication
};
