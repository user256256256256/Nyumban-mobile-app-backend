import { success } from '../../common/utils/responseBuilder.js';
import RentManagementService from './rent-management.service.js';
import { handleControllerError } from '../../common/utils/handleControllerError.js';

export const getCurrentRentalDetailsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyId } = req.params;
    const { unitId } = req.query;

    const result = await RentManagementService.getCurrentRentalDetails({
      userId,
      propertyId,
      unitId,
    });

    return success(res, result, 'Rental details fetched successfully');
  } catch (error) {
    return handleControllerError(res, error, 'GET_RENTAL_DETAILS_ERROR', 'Failed to fetch rental details');
  }
};

export const initiateRentPaymentHandler = async (req, res) => {
    try {
      const userId = req.user.id;
      const { payment_method } = req.body;
  
      const result = await RentManagementService.initiateRentPayment({ userId, payment_method, });
      return success(res, result, 'Rent payment made successful');
    } catch (error) {
      handleControllerError(res, error, 'MAKE_PAYMENT_ERROR', 'Failed to make rent payment');
    }
};

export const getPaymentHistoryHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await RentManagementService.getPaymentHistory({ userId });
    return success(res, result, 'Payment history fetched successfully')
  } catch (error) {
    handleControllerError(res, error, 'GET_PAYMENTS_ERROR', 'Failed to ger payments history');
  }
}