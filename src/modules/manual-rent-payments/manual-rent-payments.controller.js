import { success } from '../../common/utils/response-builder.util.js';
import ManualRentPaymentService from './manual-rent-payments.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

export const markManualPaymentHandler = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { amount, method, notes } = req.body;
    const landlordId = req.user.id;

    const result = await ManualRentPaymentService.markManualPayment({
      tenantId,
      amount,
      method,
      notes,
      landlordId,
    });

    return success(res, result, 'Manual rent payment recorded successfully');
  } catch (error) {
    return handleControllerError(res, error, 'MANUAL_RENT_PAYMENT_FAILED', 'Failed to mark payment');
  }
};

export const markManualInitialRentPaymentHandler = async (req, res) => {
  try {
    const { tenantId, agreementId } = req.params;
    const { amount, method, notes } = req.body;
    const landlordId = req.user.id;

    const result = await ManualRentPaymentService.markManualInitialRentPayment({
      landlordId,
      tenantId,
      agreementId,
      amount,
      method,
      notes,
    });

    return success(res, result, 'Manual initial rent payment recorded successfully');
  } catch (error) {
    return handleControllerError(res, error, 'MANUAL_INITIAL_RENT_PAYMENT_FAILED', 'Failed to mark initial payment');
  }
};
