import { success } from '../../common/utils/response-builder.util.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';
import TerminateAgreementService from './agreement-termination.service.js';
import NonPaymentTerminateService from './non-payment-reason.service.js'
import BreachTerminateService from './breach-reason.service.js'
import MutualAgreementTerminateService from './mutual-agreement-reason.service.js'
import AgreementManagementService from '../agreement-management/agreement-management.service.js';

export const terminateAgreementHandler = async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { reason, description, graceDays } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await TerminateAgreementService.terminateAgreement({
      agreementId,
      userId,
      userRole,
      reason,
      description,
      graceDays, 
    });

    return success(
      res,
      result,
      'Agreement termination process initiated successfully'
    );
  } catch (error) {
    return handleControllerError(
      res,
      error,
      'TERMINATE_AGREEMENT_FAILED',
      'Failed to terminate agreement'
    );
  }
};

export const cancelEvictionHandler = async (req, res) => {
    try {
      const { evictionId } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;
  
      const result = await NonPaymentTerminateService.cancelEviction({
        evictionId,
        userId,
        userRole,
        reason,
      });
  
      return success(res, result, 'Eviction canceled successfully');
    } catch (error) {
      return handleControllerError(
        res,
        error,
        'CANCEL_EVICTION_FAILED',
        'Failed to cancel eviction'
      );
    }
};

export const confirmEvictionHandler = async (req, res) => {
    try {
      const { evictionIds } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;
  
      const results = [];
      for (const evictionId of evictionIds) {
        const result = await NonPaymentTerminateService.confirmEviction({
          evictionId,
          userId,
          userRole,
        });
        results.push(result);
      }
  
      return success(res, results, 'Eviction(s) confirmed successfully');
    } catch (error) {
      return handleControllerError(
        res,
        error,
        'CONFIRM_EVICTION_FAILED',
        'Failed to confirm eviction(s)'
      );
    }
};

export const breachAdminReviewHandler = async (req, res) => {
  try {
    const { breachLogId } = req.params;
    const { outcome, remedyDeadline } = req.body;

    const result = await BreachTerminateService.processBreachAdminOutcome({
      breachLogId,
      outcome,
      remedyDeadline,
    });

    return success(res, result, 'Breach review outcome processed successfully');
  } catch (error) {
    return handleControllerError(res, error, 'BREACH_REVIEW_FAILED', 'Failed to process breach review outcome');
  }
};

export const confirmBreachEvictionHandler = async (req, res) => {
  try {
    const { agreementId } = req.params;
    const landlordId = req.user.id;

    const result = await BreachTerminateService.confirmBreachEviction({
      agreementId,
      landlordId,
    });

    return success(res, result, 'Breach eviction confirmed successfully');
  } catch (error) {
    return handleControllerError(res, error, 'CONFIRM_BREACH_FAILED', 'Failed to confirm breach eviction');
  }
};

export const acceptMutualTerminationHandler = async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { accept, graceDays } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!accept) {
      return res.status(400).json({
        success: false,
        message: 'To proceed, accept must be true',
      });
    }

    const agreement = await MutualAgreementTerminateService.getAgreement(agreementId);

    const result = await MutualAgreementTerminateService.acceptMutualTermination({
      agreement,
      userId,
      userRole,
      graceDays,
    });

    return success(res, result, 'Mutual termination accepted successfully');
  } catch (error) {
    return handleControllerError(
      res,
      error,
      'ACCEPT_MUTUAL_TERMINATION_FAILED',
      'Failed to accept mutual termination'
    );
  }
};

export const cancelMutualTerminationHandler = async (req, res) => {
  try {
    const { agreementId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const agreement = await AgreementManagementService.getAgreement(userId, agreementId);

    const result = await MutualAgreementTerminateService.cancelMutualTermination({
      agreement,
      userId,
      userRole,
    });

    return success(res, result, 'Mutual termination cancelled successfully');
  } catch (error) {
    return handleControllerError(
      res,
      error,
      'CANCEL_MUTUAL_TERMINATION_FAILED',
      'Failed to cancel mutual termination'
    );
  }
};