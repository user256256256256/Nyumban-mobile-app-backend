import { success } from '../../common/utils/responseBuilder.js';
import TenantProfileService from './tenant-profile.service.js';
import { handleControllerError } from '../../common/utils/handleControllerError.js';

export const getTenantProfileHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await TenantProfileService.getTenantProfile(userId);
    return success(res, profile, 'Tenant profile fetched successfully');
  } catch (error) {
    return handleControllerError(res, error, 'GET_TENANT_PROFILE_FAILED', 'Failed to fetch tenant profile');
  }
};

export const updateTenantProfileHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await TenantProfileService.updateTenantProfile(userId, req.body);
    return success(res, result, 'Profile updated successfully');
  } catch (error) {
    return handleControllerError(res, error, 'UPDATE_TENANT_PROFILE_FAILED', 'Failed to update profile');
  }
};
