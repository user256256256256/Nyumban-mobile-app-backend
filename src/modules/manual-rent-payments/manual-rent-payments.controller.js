import { success } from '../../common/utils/responseBuilder.js';
import ManualRentPaymentService from './manual-rent-payments.service.js';
import { handleControllerError } from '../../common/utils/handleControllerError.js';

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
