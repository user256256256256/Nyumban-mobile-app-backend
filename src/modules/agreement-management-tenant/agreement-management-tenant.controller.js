import { success } from '../../common/utils/response-builder.util.js';
import AgreementManagementService from './agreement-management-tenant.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

export const getTenantAgreementsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 10, cursor } = req.query;

    const result = await AgreementManagementService.getTenantAgreements({
      userId,
      status,
      limit: Number(limit),
      cursor,
    });

    return success(res, result, 'Tenant agreements fetched successfully');
  } catch (error) {
    return handleControllerError(res, error, 'GET_TENANT_AGREEMENTS_ERROR', 'Failed to fetch tenant agreements');
  }
};

export const acceptAgreementHandler = async (req, res) => {
  try {
      const userId = req.user.id;
      const agreementId = req.params.agreementId
      const result = await AgreementManagementService.acceptAgreement(userId, agreementId, req.body)
      return success(res, result, 'Agreement signed successfully')
  } catch (error) {
      return handleControllerError(res, error, 'SIGN_AGREEMENT_ERROR', 'Failed to sign agreement')
  }
}