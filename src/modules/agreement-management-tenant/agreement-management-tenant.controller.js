import { success } from '../../common/utils/response-builder.util.js';
import AgreementManagementService from './agreement-management-tenant.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

export const getLeaseAgreementHandler = async (req, res) => {
    try {
      const userId = req.user.id;
      const { propertyId }  = req.params;

      const { unitId } = req.query;
  
      const result = await AgreementManagementService.getLeaseAgreement(userId, propertyId, unitId);
      
      return success(res, result, 'Lease agreement fetched successfully');
    } catch (error) {
      return handleControllerError(res, error, 'GET_LEASE_AGREEMENT_ERROR', 'Failed to fetch lease agreement');
    }
};

export const getTenantAgreementsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    // Found a query
    const { status, limit = 10, offset = 0 } = req.query;

    const result = await AgreementManagementService.getTenantAgreements({
      userId,
      status,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    return success(res, result, 'Tenant agreements fetched successfully');
  } catch (error) {
    return handleControllerError(res, error, 'GET_TENANT_AGREEMENTS_ERROR', 'Failed to fetch tenant agreements');
  }
};

export const cancelAgreementHandler = async (req, res) => {
  try {
    const userId = req.user.id
    const { agreementId } = req.params
    const result = await AgreementManagementService.cancelAgreement({ agreementId, userId })
    return success(res, result, 'Agreement canceled successfully');
  } catch (error) {
    return handleControllerError(res, error, 'CANCEL_AGREEMENT_ERROR', 'Failed to cancel agreement');
  }
}

export const deleteRentalAgreementHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { agreementId } = req.params;
    const result = await RentalAgreementService.deleteAgreement(userId, agreementId);
    return success(res, result, 'Agreement deleted successfully');
  } catch (error) {
    return handleControllerError(res, error, 'DELETE_AGREEMENT_ERROR');
  }
};

export const deleteRentalAgreementsBatchHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { agreementIds } = req.body;
    const result = await RentalAgreementService.deleteAgreementsBatch(userId, agreementIds);
    return success(res, result, 'Agreements deleted successfully');
  } catch (error) {
    return handleControllerError(res, error, 'DELETE_AGREEMENTS_BATCH_ERROR');
  }
};

export const cancelRentalAgreementsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { agreementIds } = req.body;
    const result = await RentalAgreementService.cancelAgreements(userId, agreementIds);
    return success(res, result, 'Agreements cancelled successfully');
  } catch (error) {
    return handleControllerError(res, error, 'CANCEL_AGREEMENTS_ERROR');
  }
};

