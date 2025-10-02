import { success } from '../../common/utils/response-builder.util.js';
import ManualRefundService from './manual-refund-payments.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

export const processManualRefundHandler = async (req, res) => {
  try {
    const { agreementId } = req.params;
    const landlordId = req.user.id;
    const { action, amount, notes } = req.body;

    const refundResult = await ManualRefundService.processManualSecurityDepositRefund({
      agreementId,
      landlordId,
      action,
      amount,
      notes,
    });

    return success(res, refundResult, 'Security deposit refund processed successfully');
  } catch (error) {
    return handleControllerError(
      res,
      error,
      'SECURITY_DEPOSIT_REFUND_ERROR',
      'Failed to process manual refund'
    );
  }
};

export const processAdvanceRentRefundHandler = async (req, res) => {
  try {
    const { agreementId } = req.params;
    const landlordId = req.user.id;
    const {notes } = req.body;

    const refundResult = await ManualRefundService.processAdvanceRentRefund({
      agreementId,
      landlordId,
      notes,
    });

    return success(res, refundResult, 'Advance rent refund processed successfully');
  } catch (error) {
    return handleControllerError(
      res,
      error,
      'ADVANCE_RENT_REFUND_ERROR',
      'Failed to process advance rent refund'
    );
  }
};
