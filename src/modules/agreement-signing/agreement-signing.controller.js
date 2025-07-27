import { success } from '../../common/utils/response-builder.util.js';
import AgreementSigningService from './agreement-signing.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

export const acceptAgreementHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const agreementId = req.params.agreementId
        const result = await AgreementSigningService.acceptAgreement(userId, agreementId, req.body)
        return success(res, result, 'Agreement signed successfully')
    } catch (error) {
        return handleControllerError(res, error, 'SIGN_AGREEMENT_ERROR', 'Failed to sign agreement')
    }
}

export const processInitialRentPaymentHandler = async (req, res) => {
    try {
        const { agreementId } = req.params
        const userId = req.user.id
        const { payment_method } = req.body

        const result = await AgreementSigningService.processInitialRentPayment({ userId, agreementId, payment_method })
        return success(res, result, 'Rent payment completed successfully')
    } catch (error) {
        return handleControllerError(res, error, 'RENT_PAYMENT_FAILED', 'Rent payment failed');
    }
}
