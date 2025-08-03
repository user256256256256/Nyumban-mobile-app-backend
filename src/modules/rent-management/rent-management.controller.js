import { success } from '../../common/utils/response-builder.util.js';
import RentManagementService from './rent-management.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

export const getCurrentRentalDetailsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyId } = req.params;
    // Found a query
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
    const { payment_method, amount } = req.body;

    const result = await RentManagementService.initiateRentPayment({
      userId,
      payment_method,
      amount,
    });

    return success(res, result, 'Rent payment made successfully');
  } catch (error) {
    handleControllerError(res, error, 'MAKE_PAYMENT_ERROR', 'Failed to make rent payment');
  }
};


export const getPaymentHistoryHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year, status, limit = 10, cursor } = req.query;

    const result = await RentManagementService.getPaymentHistory({
      userId,
      month: month ? parseInt(month, 10) : undefined,
      year: year ? parseInt(year, 10) : undefined,
      status,
      limit: Number(limit),
      cursor,
    });

    return success(res, result, 'Payment history fetched successfully');
  } catch (error) {
    handleControllerError(res, error, 'GET_PAYMENTS_ERROR', 'Failed to get payments history');
  }
};



export const getRentStatusHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await RentManagementService.getRentStatus({ userId });
    return success(res, result, 'Rent status fetched successfully');
  } catch (error) {
    return handleControllerError(res, error, 'GET_RENT_STATUS_ERROR', 'Failed to fetch rent status');
  }
}

export const checkAdvanceEligibilityHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyId } = req.params;

    const result = await RentManagementService.checkAdvanceEligibility({ userId, propertyId });
    return success(res, result, 'Advance eligibility fetched');
  } catch (error) {
    return handleControllerError(res, error, 'ADVANCE_ELIGIBILITY_ERROR', 'Failed to fetch advance eligibility');
  }
};

export const getRentAndDepositHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyId } = req.params;
    const { unitId } = req.query;

    const result = await RentManagementService.getRentAndDeposit({ userId, propertyId, unitId });

    return success(res, result, 'Monthly rent and security deposit fetched successfully');
  } catch (error) {
    return handleControllerError(res, error, 'GET_RENT_DEPOSIT_ERROR', 'Failed to fetch rent and deposit');
  }
};