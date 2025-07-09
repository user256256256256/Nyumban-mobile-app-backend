import prisma from '../../prisma-client.js';
import { v4 as uuidv4 } from 'uuid';
import { uploadToStorage, uploadMultipleImages, upload3DTourFile } from '../../common/services/s3.service.js';
import { generateUniquePropertyCode } from '../../common/utils/generatePropertyCode.js';


import {
  ValidationError,
  NotFoundError,
  AuthError,
  ForbiddenError,
  ServerError,
} from '../../common/services/errors.js';

export const addOwnershipInfo = async ({ userId, data }) => {
  const {
    property_name,
    property_type,
    price,
    currency,
    address,
    country,
    property_website,
    status = 'available',
  } = data;

  if (!property_name || !property_type || !price || !currency || !address || !country) {
    throw new ValidationError('Missing required ownership information');
  }

  const id = uuidv4();
  const property_code = await generateUniquePropertyCode(country, property_type);

  const created = await prisma.properties.create({
    data: {
      id,
      owner_id: userId,
      property_name,
      property_type,
      price,
      currency,
      address,
      country,
      property_website,
      property_code,
      status,
      created_at: new Date()
    },
    select: {
      id: true,
      property_name: true,
      property_code: true,
      status: true,
      has_units: true,
    },
  });

  // STEP 2: Check if landlord is verified
  const landlord = await prisma.landlord_profiles.findUnique({
    where: { user_id: userId },
    select: { is_verified: true },
  });

  if (landlord?.is_verified) {
    // STEP 3: Invalidate landlord verification
    await prisma.landlord_profiles.update({
      where: { user_id: userId },
      data: { is_verified: false },
    });

    // Step 4: Check if a pending verification request already exists
    const existingPending = await prisma.account_verification_requests.findFirst({
      where: {
        user_id: userId,
        status: 'pending',
        is_deleted: false
      },
    });

    // STEP 5: Create new pending verification request
    if (!existingPending) {
      await prisma.account_verification_requests.create({
        data: {
          id: uuidv4(),
          user_id: userId,
          status: 'pending',
          is_deleted: false,
          created_at: new Date(),
          // comment and proof_of_ownership_file_path left null until submitted
        },
      });
    }

    // (Optional: queue/send notification to landlord here)
  }

  return created;
};


export const addPhysicalAttributes = async ({ userId, propertyId, data }) => {
  const {
    bedrooms,
    bathrooms,
    year_built,
    parking_spaces,
    energy_efficiency_features,
    amenities,
    open_house_dates,
    description,
    pet_policy,
    smoking_policy
  } = data;

  const property = await prisma.properties.findFirst({
    where: {
      id: propertyId,
      owner_id: userId,
      is_deleted: false,
    },
  });

  if (!property) throw new NotFoundError('Property not found or access denied');

  const updated = await prisma.properties.update({
    where: { id: propertyId },
    data: {
      bedrooms,
      bathrooms,
      year_built,
      parking_spaces,
      energy_efficiency_features,
      amenities,
      open_house_dates,
      description,
      pet_policy,
      smoking_policy,
      updated_at: new Date(),
    },
  });

  return updated;
};

export const uploadPropertyThumbnail = async (propertyId, file) => {
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

export const uploadPropertyTour = async (property_id, file) => {
  if (!property_id || !file) throw new NotFoundError('Property ID and file are required');

  const url = await upload3DTourFile(file);

  await prisma.properties.update({
    where: { id: property_id },
    data: { tour_3d_url: url, updated_at: new Date() },
  });

  return { propertyId: property_id,  tour_3d_url: url };
};

export const uploadPropertyImages = async (property_id, files) => {
  if (!property_id || !files?.length) throw new NotFoundError('Property ID and images are required');

  const urls = await uploadMultipleImages(files);

  const imageRecords = urls.map(url => ({
    property_id,
    image_url: url,
    created_at: new Date(),
  }));

  await prisma.property_images.createMany({ data: imageRecords });

  return { propertyId: property_id, images: urls };
};

export const addUnitToProperty = async (propertyId, unitData) => {
  const property = await prisma.properties.findUnique({
    where: { id: propertyId },
    include: { property_units: true },
  });

  if (!property) throw new NotFoundError('Property not found');

  const unit = await prisma.property_units.create({
    data: {
      id: uuidv4(),
      property_id: propertyId,
      unit_number: unitData.unit_number,
      status: unitData.status,
      price: unitData.price,
      bedrooms: unitData.bedrooms,
      bathrooms: unitData.bathrooms,
      description: unitData.description,
      created_at: new Date(),
    },
  });

  // If this is the first unit, update has_units to true
  if (property.property_units.length === 0) {
    await prisma.properties.update({
      where: { id: propertyId },
      data: { has_units: true },
    });
  }

  return unit;
};


export default {
  addOwnershipInfo,
  addPhysicalAttributes, 
  uploadPropertyThumbnail,
  uploadPropertyTour,
  uploadPropertyImages,
  addUnitToProperty,
};

