import { success } from '../../common/utils/responseBuilder.js';
import AgreementManagementService from './agreement-management.service.js';
import { handleControllerError } from '../../common/utils/handleControllerError.js';

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