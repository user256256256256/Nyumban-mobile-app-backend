import { success } from '../../common/utils/responseBuilder.js';
import LandlordProfileService from './landlord-profile.service.js';
import { handleControllerError } from '../../common/utils/handleControllerError.js';

export const getLandlordProfileHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await LandlordProfileService.getLandlordProfile(userId);
    return success(res, profile, 'Landlord profile fetched successfully');
  } catch (error) {
    return handleControllerError(res, error, 'GET_LANDLORD_PROFILE_FAILED', 'Failed to fetch landlord profile');
  }
};

export const updateLandlordProfileHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await LandlordProfileService.updateLandlordProfile(userId, req.body);
    return success(res, result, 'Profile updated successfully');
  } catch (error) {
    return handleControllerError(res, error, 'UPDATE_LANDLORD_PROFILE_FAILED', 'Failed to update landlord profile');
  }
};
