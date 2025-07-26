import prisma from '../../prisma-client.js';
import { generateUniqueLandlordCode } from '../../common/utils/user-code-generator.js';

import { v4 as uuidv4 } from 'uuid';
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
  try {
    const profile = await prisma.landlord_profiles.upsert({
      where: { user_id: userId },
      update: {
        ...data,
      },
      create: {
        id: uuidv4(),
        ...data,
        user_id: userId,
        landlord_code: await generateUniqueLandlordCode(),
      },
    });

    return { profile };
  } catch (error) {
    throw new ServerError('Failed to upsert landlord profile', { field: 'User ID' });
  }
};

export default {
  getLandlordProfile,
  updateLandlordProfile
};
