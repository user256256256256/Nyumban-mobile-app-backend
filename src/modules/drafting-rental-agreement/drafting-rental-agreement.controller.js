import { success } from '../../common/utils/responseBuilder.js';
import DraftingRentalAgreementService from './drafting-rental-agreement.service.js';
import { handleControllerError } from '../../common/utils/handleControllerError.js';

export const checkAgreementExistsHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const { propertyId } = req.params;
        const { unitId }  = req.query
        const result = await DraftingRentalAgreementService.checkAgreementExists(userId, propertyId, unitId)
        return success(res, result, 'Agreeement status retrieved successfully')
    } catch (error) {
        handleControllerError(res, error, 'GET_AGREEMENT_STATUS_ERROR', 'Failed to get agreement status')
    }
}

export const createOrUpdateDraftHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const { propertyId } = req.params;
        const { unitId }  = req.query;
        const payload = req.body;
        const result = await DraftingRentalAgreementService.createOrSaveDraft(userId, propertyId, unitId, payload)
        return success(res, result, 'Agreement draft saved successfully')
    } catch (error) {
        handleControllerError(res, error, 'AGREEMENT_DRAFT_ERROR', 'Failed to save agreement draft')
    }
}

export const generateAgreementPreviewHandler = async (req, res) => {
    try {
        const { agreementId } = req.params;
        const result = await DraftingRentalAgreementService.generateAgreementPreview(agreementId) 
        return success(res, result, 'Agreement preview retrieved successfully')
    } catch (error) {
        handleControllerError(res, error, 'AGREEMENT_PREVIEW_ERROR', 'Failed to preview agreement')
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