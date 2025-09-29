import { success } from '../../common/utils/response-builder.util.js';
import PaymentManagementService from './payment-management.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

export const getPaymentsHandler = async (req, res) => {
  try {
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
