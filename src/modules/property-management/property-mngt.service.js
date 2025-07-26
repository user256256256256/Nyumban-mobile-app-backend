import slugify from 'slugify';
import prisma from '../../prisma-client.js';
import OTPService from '../auth/otp.service.js';
import { uploadToStorage, uploadMultipleImages, upload3DTourFile } from '../../common/services/s3.service.js';

import {
    ValidationError,
    NotFoundError,
    AuthError,
    ForbiddenError,
    ServerError,
} from '../../common/services/errors.js';

export const getLandlordProperties = async ({ landlordId, sortBy: sort_by, order = 'desc', filterStatus: filter_status }) => {
    const where = {
      owner_id: landlordId,
      is_deleted: false,
    };
  
    const sortFieldMap = {
      date: 'created_at',
      likes: 'likes',
      saves: 'saves',
      title: 'property_name',
    };
  
    const useCountSort = ['applications', 'tours'].includes(sort_by);
    const sortField = sortFieldMap[sort_by] || 'created_at';
  
    const properties = await prisma.properties.findMany({
      where,
      orderBy: useCountSort
        ? { _count: { [sort_by === 'applications' ? 'property_applications' : 'property_tour_requests']: order } }
        : { [sortField]: order },
      select: {
        id: true,
        property_name: true,
        created_at: true,
        likes: true,
        saves: true,
        is_verified: true,
        has_units: true,
        price: true,
        _count: {
          select: {
            property_applications: true,
            property_tour_requests: true,
            property_units: true,
          },
        },
      },
    });
  
    return properties.map((prop) => {
      const hasUnits = prop.has_units;
      const unitCount = prop._count.property_units || 0;
  
      return {
        property_id: prop.id,
        title: prop.property_name,
        created_at: prop.created_at,
        likes: prop.likes || 0,
        saves: prop.saves || 0,
        applications: prop._count.property_applications || 0,
        tours: prop._count.property_tour_requests || 0,
        verified: prop.is_verified,
        has_units: hasUnits,
        status: hasUnits ? `Status: ${unitCount} units available` : undefined,
        price: !hasUnits ? prop.price : undefined,
      };
    });
};

export const getPropertyDetails = async (propertyId) => {
  const property = await prisma.properties.findUnique({
    where: { id: propertyId },
    include: {
      property_units: true,
      property_images: true,
      property_applications: true,
      property_tour_requests: true
    }
  });

  if (!property) throw new NotFoundError('Property not found');
  const hasUnits = property.has_units;

  const applications = property.property_applications || [];
  const tours = property.property_tour_requests || [];

  const response = {
    property_id: property.id,
    title: property.property_name,
    ownership: {
      owner_id: property.owner_id,
      ownership_file_path: property.ownership_file_path
    },
    location: {
      address: property.address,
      country: property.country
    },
    financial: {
      price: hasUnits ? null : property.price,
      currency: property.currency
    },
    physical_attributes: {
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      year_built: property.year_built,
      parking_spaces: property.parking_spaces,
      amenities: property.amenities,
      energy_efficiency_features: property.energy_efficiency_features
    },
    media: {
      thumbnail_image_path: property.thumbnail_image_path,
      gallery: property.property_images.map(img => img.image_path),
      tour_3d_url: property.tour_3d_url
    },
    legal: {
      is_verified: property.is_verified,
      has_agreement: property.has_agreement,
      status: property.status
    },
    open_house: {
      open_house_dates: property.open_house_dates
    },
    notes: {
      pet_policy: property.pet_policy,
      smoking_policy: property.smoking_policy,
      description: property.description
    },
    analytics: {
      likes: property.likes || 0,
      saves: property.saves || 0,
      tour_requests: {
        approved: tours.filter(a => a.status === 'accepted').length,
        pending: tours.filter(a => a.status === 'pending').length,
        declined: tours.filter(a => a.status === 'declined').length 
      },
      applications: {
        approved: applications.filter(a => a.status === 'approved').length,
        pending: applications.filter(a => a.status === 'pending').length,
        declined: applications.filter(a => a.status === 'declined').length
      },
      average_rating: 4.5 // Optional: Replace with actual logic if implemented
    },
    has_units: hasUnits,
    units: hasUnits
      ? property.property_units.map(unit => ({
          unit_id: unit.id,
          unit_number: unit.unit_number,
          price: unit.price,
          status: unit.status,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
          description: unit.description
        }))
      : []
  };

  return response;
}

export const updatePropertyDetails = async (propertyId, data) => {
  const existing = await prisma.properties.findUnique({ where: { id: propertyId, is_deleted: false } });
  if(!existing) throw new NotFoundError('Property Not Found');

  const updated = await prisma.properties.update({
    where: { id: propertyId },
    data: {
      ...data,
      updated_at: new Date(),
    }
  })

  return updated;
}

export const updatePropertyThumbnail = async (propertyId, file) => {
  const thumbnailUrl = await uploadToStorage(file.buffer, file.originalname);

  const updated = await prisma.properties.update({
    where: { id: propertyId },
    data: {
      thumbnail_image_path: thumbnailUrl,
      updated_at: new Date()
    }
  });

  return { property_id: propertyId, thumbnail_url: updated.thumbnail_image_path };
};

export const updatePropertyTour = async (propertyId, file) => {
  const tourUrl = await upload3DTourFile(file);

  await prisma.properties.update({
    where: { id: propertyId },
    data: {
      tour_3d_url: tourUrl,
      updated_at: new Date()
    }
  });

  return { property_id: propertyId, tour_3d_url: tourUrl };
};

export const updatePropertyImages = async (propertyId, files) => {
  const imageUrls = await uploadMultipleImages(files);

  // Optionally clear existing images (if this is a true "update" instead of append)
  await prisma.property_images.deleteMany({ where: { property_id: propertyId } });

  const records = imageUrls.map(url => ({
    property_id: propertyId,
    image_url: url,
    created_at: new Date(),
  }));

  await prisma.property_images.createMany({ data: records });

  return { property_id: propertyId, images: imageUrls };
};

export const updateUnit = async (unitId, unitData) => {
  const unit = await prisma.property_units.findUnique({ where: { id: unitId } });
  if (!unit) throw new NotFoundError('Unit not found');

  const updated = await prisma.property_units.update({
    where: { id: unitId },
    data: {
      ...unitData,
      updated_at: new Date(),
    },
  });

  return updated;
};

export const deleteUnit = async (unitId) => {
  const unit = await prisma.property_units.findUnique({
    where: { id: unitId },
  });

  if (!unit || unit.is_deleted) {
    throw new NotFoundError('Unit not found');
  }

  await prisma.property_units.update({
    where: { id: unitId },
    data: {
      is_deleted: true,
      deleted_at: new Date(),
      updated_at: new Date(),
    },
  });

  const remainingUnits = await prisma.property_units.count({
    where: {
      property_id: unit.property_id,
      is_deleted: false,
    },
  });

  if (remainingUnits === 0) {
    await prisma.properties.update({
      where: { id: unit.property_id },
      data: { has_units: false },
    });
  }

  return { deleted: true, unit_id: unitId };
};

export const updatePropertyStatus = async (propertyId, status) => {
  const property = await prisma.properties.findUnique({ where: { id: propertyId } });
  if (!property) throw new NotFoundError('Property not found');

  const updated = await prisma.properties.update({
    where: ({ id: propertyId }),
    data: {
      status, 
      updated_at: new Date(),
    }
  })

  return { id: updated.id, status: updated.status };
}

export const updatePropertyUnitStatus = async (unitId, status) => {
  const unit = await prisma.property_units.findUnique({ where: { id: unitId } });
  if (!unit) throw new NotFoundError('Property unit not found');

  const updated = await prisma.property_units.update({
    where: ({ id: unitId }),
    data: {
      status, 
      updated_at: new Date(),
    }
  })

  return { id: updated.id, status: updated.status };
}

export const generateShareLink = async (propertyId) => {
  const property = await prisma.properties.findUnique({
    where: { id: propertyId, is_deleted: false },
    select: { id: true, property_name: true }
  });

  if(!property) throw new NotFoundError('Property not found')

  const slug = slugify(property.property_name || 'property', {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  })

  const shareUrl = `${process.env.BASE_URL}/p/${slug}-${propertyId}`;

  return { property_name: property.property_name, url: shareUrl }
}

export const confirmOtpAndDeleteProperty = async (userId, propertyId, otpCode, identifier) => {
  const property = await prisma.properties.findUnique({
    where: { id: propertyId },
    select: { owner_id: true, is_deleted: true },
  });
  if (!property || property.is_deleted) throw new NotFoundError('Property not found or already deleted');
  if (property.owner_id !== userId) throw new ForbiddenError('Access denied', { field: 'User ID' });

  if (!identifier) throw new ValidationError('Identifier (email or phone) is required', { field: 'Identifier' });

  const isValidOtp = await OTPService.verifyOtp(identifier, otpCode);
  if (!isValidOtp) throw new AuthError('Invalid or expired OTP code');

  const now = new Date();
  await prisma.properties.update({
    where: { id: propertyId },
    data: {
      is_deleted: true,
      deleted_at: now,
      status: 'archived',
      updated_at: now,
    },
  });

  await prisma.property_units.updateMany({
    where: { property_id: propertyId },
    data: {
      is_deleted: true,
      deleted_at: now,
      updated_at: now,
    },
  });

  return { property_id: propertyId, status: 'deleted' };
};

export default {
  getLandlordProperties, 
  getPropertyDetails, 
  updatePropertyDetails,
  updatePropertyThumbnail,
  updatePropertyTour, 
  updatePropertyImages,
  updateUnit,
  deleteUnit,
  updatePropertyStatus,
  updatePropertyUnitStatus, 
  generateShareLink,
  confirmOtpAndDeleteProperty, 
};