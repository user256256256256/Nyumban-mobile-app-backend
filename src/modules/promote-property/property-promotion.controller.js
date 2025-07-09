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

export const getPromotionPlansHandler = async (req, res) => {
  try {
    const plans = await PropertyPromotionService.getPromotionPlans();
    return success(res, { plans }, 'Promotion plans retrieved successfully');
  } catch (error) {
    return handleControllerError(res, error, 'PROMOTION_GET_ERROR', 'Failed to get promotion plans');
  }
}

export const promotePropertyHandler = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { planId, paymentMethod, phoneNumber, force } = req.body;
    const result = await PropertyPromotionService.promoteProperty(
      req.user.id,
      propertyId,
      planId,
      paymentMethod,
      phoneNumber,
      force
    );
    return success(res, result, 'Property promotion activated successfully');
  } catch (err) {
    return handleControllerError(res, err, 'PROMOTION_ERROR', 'Failed to promote property');
  }
};

export async function getPropertyPromotionStatusHandler(req, res) {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;  
    const result = await PropertyPromotionService.getPropertyPromotionStatus(userId, propertyId);
    return success(res, result, 'Property promotion status retrieved successfully');
  } catch (error) {
    return handleControllerError(res, error, 'GET_PROMOTION_STATUS_ERROR', 'Failed to get property promotion status');
  }
}