// src/modules/agreement-management-landlord/refund-payments.controller.js
import { success } from '../../common/utils/response-builder.util.js';
import RefundService from './refund-payments.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

// 🏠 Security deposit refund (real simulation)
export const processSecurityDepositRefundHandler = async (req, res) => {
  try {
    const { agreementId } = req.params;
    const landlordId = req.user.id;
    const { action, reason, notes, amount } = req.body;

    const result = await RefundService.processSecurityDepositRefund({
      agreementId,
      landlordId,
      action,
      amount,
      reason,
      notes
    });

    return success(res, result, 'Security deposit refund initiated successfully');
  } catch (error) {
    return handleControllerError(res, error, 'SECURITY_DEPOSIT_REFUND_ERROR', 'Failed to initiate security deposit refund');
  }
};

// 🏠 Advance rent refund (real simulation)
export const processAdvanceRentRefundHandler = async (req, res) => {
  try {
    const { agreementId } = req.params;
    const landlordId = req.user.id;
    const { reason, notes } = req.body;

    const result = await RefundService.processAdvanceRentRefund({
      agreementId,
      landlordId,
      reason,
      notes
    });

    return success(res, result, 'Advance rent refund initiated successfully');
  } catch (error) {
    return handleControllerError(res, error, 'ADVANCE_RENT_REFUND_ERROR', 'Failed to initiate advance rent refund');
  }
};
