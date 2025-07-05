import prisma from '../../prisma-client.js';

import {
    ValidationError,
    NotFoundError,
    AuthError,
    ForbiddenError,
    ServerError,
} from '../../common/services/errors.js';

export const checkLandlordVerificationStatus = async (userId) => {
  const landlordProfile = await prisma.landlord_profiles.findUnique({
    where: { user_id: userId },
    select: { is_verified: true }
  });

  if (!landlordProfile) throw new NotFoundError('Landlord profile not found');

  if (!landlordProfile.is_verified) {
    return { verified: landlordProfile.is_verified, message: 'Account not verified to promote properties'};
  }

  return { verified: landlordProfile.is_verified,  message: 'Landlord account verified for promotions'};
};

export default {
  checkLandlordVerificationStatus,
};