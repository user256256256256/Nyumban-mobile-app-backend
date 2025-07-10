import { success } from '../../common/utils/responseBuilder.js';
import ApplicationRequestService from './application-request.service.js';
import { handleControllerError } from '../../common/utils/handleControllerError.js';

export const applicationRequestHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await ApplicationRequestService.applicationRequest(req.body, userId)
        return success(res, result, 'Application submitted successfully')
    } catch (error) {
        handleControllerError(res, error, 'APPLICATION_SUBMISSION_ERROR', 'Failed to submit application.')
    }
}

export const getApplicationsRequestHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await ApplicationRequestService.getApplicationRequest(userId)
        return success(res, result, '')
    } catch (error) {
        handleControllerError(res, error, 'GET_APPLICATION_REQUEST_ERROR', 'Failed to get application requests.')
    }
}

export const cancelApplicationRequestHanlder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { applicationId } = req.body;
        const result = await ApplicationRequestService.cancelApplication(userId, applicationId)
        return success(res, result, 'Application cancelled successfully')
    } catch (error) {
        handleControllerError(res, error, 'APPLICATION_CANCEL_ERROR', 'Failed to cancel application request'); 
    }
}