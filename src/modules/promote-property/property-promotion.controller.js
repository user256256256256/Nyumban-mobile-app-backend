import { success } from '../../common/utils/responseBuilder.js';
import PropertyPromotionService from './property-promotion.service.js';
import { handleControllerError } from '../../common/utils/handleControllerError.js';

export const checkLandlordVerificationStatusHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await PropertyPromotionService.checkLandlordVerificationStatus(userId);
    return success(res, result, 'Status retrieved successfully');
  } catch (error) {
    return handleControllerError(res, error, 'VERIFICATION_CHECK_ERROR', 'Failed to verify landlord');
  }
};
