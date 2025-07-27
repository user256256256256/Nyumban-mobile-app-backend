import { success } from '../../common/utils/response-builder.util.js';
import PaymentManagementService from './payment-management.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

export const getRentPaymentsHandler = async (req, res) => {
    try {
      const landlordId = req.user.id;

      const filters = req.query;
      const result = await PaymentManagementService.getRentPayments(landlordId, filters);
      return success(res, result, 'Rent Payments retrieved successfully');
    } catch (error) {
      handleControllerError(res, error, 'GET_RENT_PAYMENTS_ERROR', 'Failed to get payments');
    }
};
  
export const getRentPaymentHandler = async (req, res) => {
  try {
    const { paymentId } = req.params;
    console.log('PAYMENT_ID: ' + paymentId);
    const result = await PaymentManagementService.getRentPayment(paymentId); // ✅ add await
    console.log(result);
    return success(res, result, 'Rent Payment retrieved successfully');
  } catch (error) {
    handleControllerError(res, error, 'GET_RENT_PAYMENT_ERROR', 'Failed to get payment');
  }
};


export const getPaymentsHandler = async (req, res) => {
  try {
    // Found a query
    const filters = req.query;
    const result = await PaymentManagementService.getPayments(filters);
    return success(res, result, 'Payments retrieved successfully');
  } catch (error) {
    handleControllerError(res, error, 'GET_PAYMENTS_ERROR', 'Failed to get payments');
  }
};

export const getPaymentHandler = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const result = await PaymentManagementService.getPayment(paymentId);
    return success(res, result, 'Payment retrieved successfully');
  } catch (error) {
    handleControllerError(res, error, 'GET_PAYMENT_ERROR', 'Failed to get payment');
  }
};
