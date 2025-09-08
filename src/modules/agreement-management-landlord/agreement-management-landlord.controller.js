import { success } from '../../common/utils/response-builder.util.js';
import AgreementManagementService from './agreement-management-landlord.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

export const getAllLandlordAgreementsHandler = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const { status, limit = 10, cursor } = req.query;

    const result = await AgreementManagementService.getAllLandlordAgreements({
      landlordId,
      status,
      limit: Number(limit),
      cursor,
    });

    return success(res, result, 'Agreements fetched successfully');
  } catch (error) {
    return handleControllerError(res, error, 'GET_AGREEMENT_FAILED', 'Failed to fetch agreements');
  }
};
