import prisma from '../../prisma-client.js';
import {
  NotFoundError
} from '../../common/services/errors.js';

export const getLandlordProfile = async (userId) => {
  const profile = await prisma.landlord_profiles.findUnique({
    where: { user_id: userId }
  });

  if (!profile) {
    throw new NotFoundError('Landlord profile not found', { field: 'User ID' });
  }

  return profile;
};

export const updateLandlordProfile = async (userId, data) => {
  const existing = await prisma.landlord_profiles.findUnique({
    where: { user_id: userId }
  });

  if (!existing) {
    throw new NotFoundError('Landlord profile not found', { field: 'User ID' });
  }

  const updated = await prisma.landlord_profiles.update({
    where: { user_id: userId },
    data: {
      ...data,
    }
  });

  return { updated };
};

export default {
  getLandlordProfile,
  updateLandlordProfile
};
