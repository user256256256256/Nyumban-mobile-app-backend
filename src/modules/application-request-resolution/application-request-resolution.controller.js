import { success } from '../../common/utils/response-builder.util.js';
import ApplicationRequestResolutionService from './application-request-resolution.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

export const getLandlordApplicationRequestsHandler = async (req, res) => {
    try {
        const landlordId = req.user.id;  
  
        const { status } = req.query;
        const result = await ApplicationRequestResolutionService.getLandlordApplicationRequests(landlordId, status)
        return success(res, result, 'Landlord Property Application requests retrieved successfully');
    } catch (error) {        
        return handleControllerError(res, error, 'GET_APPLICATION_REQUESTS_ERROR', 'Failed to get landlord properties application requests');
    }
}

export const resolveApplicationRequestHandler = async (req, res) => {
    try {
        const landlordId = req.user.id;  
        const { applicationId } = req.params;
        const { action, reason } = req.body;
        const result = await ApplicationRequestResolutionService.resolveApplicationRequest(landlordId, applicationId, action, reason)
        return success(res, result, 'Application request status updated successfully')
    } catch (error) {
        return handleControllerError(res, error, 'APPLICATION_REQUEST_RESOLUTION_ERROR', 'Could not resolve application request');
    }
}