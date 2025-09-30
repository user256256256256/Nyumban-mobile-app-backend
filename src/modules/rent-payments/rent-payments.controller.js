import { success } from '../../common/utils/response-builder.util.js';
import RentPaymentService from './rent-payments.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

export const rentPaymentHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { payment_method, amount } = req.body;

    const result = await RentPaymentService.rentPayment({
      userId,
      payment_method,
      amount,
    });

    return success(res, result, 'Rent payment made successfully');
  } catch (error) {
    handleControllerError(res, error, 'MAKE_PAYMENT_ERROR', 'Failed to make rent payment');
  }
};

export const initialRentPaymentHandler = async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { notes, amount_paid } = req.body;
    const userId = req.user.id;

    const result = await RentPaymentService.initialRentPayment({
      userId,
      agreementId,
      amount_paid,
      notes,
    });

    return success(res, result, 'Initial Rent payment recorded successfully');
  } catch (error) {
    return handleControllerError(res, error, 'INITIAL_RENT_PAYMENT_FAILED', 'Failed to mark initial payment');
  }
};
