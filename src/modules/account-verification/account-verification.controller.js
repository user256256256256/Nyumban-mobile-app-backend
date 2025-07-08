import { success } from '../../common/utils/responseBuilder.js';
import AccountVerificationService from './account-verification.service.js';
import { handleControllerError } from '../../common/utils/handleControllerError.js';
import { ForbiddenError, ServerError } from '../../common/services/errors.js';

export const getLandlordAccountStatusHandler = async (req, res) => {
    try {
        const userId = req.user.id;  
        const result = await AccountVerificationService.getAccountVerificationStatus(userId);
        return success(res, result, 'Account status retrieved successfully');
    } catch (error) {
        return handleControllerError(res, error, 'GET_ACCOUNT_STATUS_ERROR', 'Failed to get landlord account status');
    }
}

export const submitVerificationRequestHandler = async (req, res) => {
    try {
        const userId = req.user.id;  
        const { ownership_comment, landlord_full_names } = req.body;
        const file = req.file;
        const result = await AccountVerificationService.submitVerificationRequest(userId, ownership_comment, landlord_full_names, file);
        return success(res, result, 'Verification request submitted successfully');
    } catch (error) {
        return handleControllerError(res, error, 'VERIFICATION_ERROR', 'Failed to submit verification details');
    }
}

export const getPropertyVerificationStatusHandler = async (req, res) => {
    try {
        const userId = req.user.id;  
        const {propertyId} = req.params;
        const result = await AccountVerificationService.getPropertyVerificationStatus(userId, propertyId)
        return success(res, result, 'Property verification status retrieved successfully');
    } catch (error) {
        return handleControllerError(res, error, 'GET_PROPERTY_VERIFICATION_STATUS_ERROR', 'Failed to get property verification status');
    }
}

export const reviewVerificationRequestHandler = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status, review_notes } = req.body;
        const adminId = req.user?.id;
        const role = req.user?.role;
        if (role !== 'admin') throw new ForbiddenError('Access denied');
        const result = await AccountVerificationService.reviewVerificationRequest({
            requestId,
            status,
            review_notes,
            adminId
          });
        return success(res, result, 'Verification request updated');
    } catch (error) {
        return handleControllerError(res, error, 'REVIEW_VERIFICATION_ERROR', 'Failed to review verification request');
    }
}

export const submitVerificationBadgePaymentHandler = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { payment_method, phone_number, amount, currency } = req.body;
        if (payment_method !== 'Flutterwave') throw new ServerError('Unsupported payment method.', { field: payment_method })
        const result = await AccountVerificationService.submitVerificationBadgePayment( { userId, phone_number, amount, currency })
        return success(res, result, 'Payment initiated successfully');
    } catch (error) {
        return handleControllerError(res, error, 'PAYMENT_INITIATION_ERROR', 'Failed to initiate payment request');
    }
}