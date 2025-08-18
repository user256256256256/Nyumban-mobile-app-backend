import { success } from '../../common/utils/response-builder.util.js';
import AccountVerificationService from './account-verification.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';
import { ForbiddenError, ServerError } from '../../common/services/errors-builder.service.js';

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
        const { ownership_comment } = req.body;
        const file = req.file;
        const result = await AccountVerificationService.submitVerificationRequest(userId, ownership_comment, file);
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
        if (role !== 'admin') throw new ForbiddenError('Access denied', { field: 'Role' } );
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
        const { phone_number } = req.body;
        const result = await AccountVerificationService.submitVerificationBadgePayment( { userId, phone_number })
        return success(res, result, 'Payment initiated successfully');
    } catch (error) {
        return handleControllerError(res, error, 'PAYMENT_INITIATION_ERROR', 'Failed to initiate payment request');
    }
}

export const updateVerificationRequestHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const { requestId } = req.params;
        const file = req.file;
        const { ownership_comment } = req.body;
    
        const result = await AccountVerificationService.updateVerificationRequest({
          userId,
          requestId,
          ownership_comment,
          file
        });
    
        return success(res, result, 'Verification request updated successfully');
    } catch (error) {
        return handleControllerError(res, error, 'UPDATE_VERIFICATION_REQUEST_ERROR', 'Failed to update verification request');
    }
}