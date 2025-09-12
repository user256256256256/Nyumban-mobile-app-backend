import { success } from '../../common/utils/response-builder.util.js';
import DraftingRentalAgreementService from './drafting-rental-agreement.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

export const createOrUpdateDraftHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const { propertyId } = req.params;
  
        const { unitId }  = req.query;
        const payload = req.body;
        const result = await DraftingRentalAgreementService.createOrUpdateDraft(userId, propertyId, unitId, payload)
        return success(res, result, 'Agreement draft saved successfully')
    } catch (error) {
        handleControllerError(res, error, 'AGREEMENT_DRAFT_ERROR', 'Failed to save agreement draft')
    }
}


export const finalizeAgreementHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const { propertyId } = req.params;
  
        const { unitId }  = req.query;
        const { status } = req.body
        const result = await DraftingRentalAgreementService.finalizeAgreement(userId, propertyId, unitId, status)
        return success(res, result, 'Agreement finalized and ready for tenant')
    } catch (error) {
        handleControllerError(res, error, 'FINALIZE_AGREEMENT_ERROR', 'Failed to mark agreement as ready')
    }
}