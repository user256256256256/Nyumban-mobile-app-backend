// src/modules/agreement-management-landlord/agreement-management-landlord.refund.controller.js
import { success } from '../../common/utils/response-builder.util.js';
import RefundService from './refund-payments.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

export const refundHandler = async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { landlordPhone, reason, description } = req.body;
    const userId = req.user.id;

    const result = await RefundService.refund({
      agreementId,
      landlordId: userId,
      landlordPhone,
      reason,
      description,
    });

    return success(res, result, 'Refund process initiated successfully');
  } catch (error) {
    return handleControllerError(res, error, 'REFUND_AGREEMENT_FAILED', 'Failed to process refund');
  }
};
