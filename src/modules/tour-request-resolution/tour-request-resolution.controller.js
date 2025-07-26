import { success } from '../../common/utils/responseBuilder.js';
import TourRequestResolutionService from './tour-request-resolution.service.js';
import { handleControllerError } from '../../common/utils/handleControllerError.js';

export const getLandlordTourRequestsHandler = async (req, res) => {
    try {
        const landlordId = req.user.id;  
  
        const { status } = req.query;
        const result = await TourRequestResolutionService.getLandlordTourRequests(landlordId, status);
        return success(res, result, 'Landlord Property Tour requests retrieved successfully');
    } catch (error) {
        return handleControllerError(res, error, 'GET_TOUR_REQUESTS_ERROR', 'Failed to get landlord properties tour requests');
    }
}

export const resolveTourRequestHandler = async (req, res) => {
    try {
        const landlordId = req.user.id;  
        const { requestId } = req.params;
        const { action, reason } = req.body;
        const result = await TourRequestResolutionService.resolveTourRequest(landlordId, requestId, action, reason);
        return success(res, result, 'Tour request status updated successfully');
    } catch (error) {
        return handleControllerError(res, error, 'TOUR_REQUEST_RESOLUTION_ERROR', 'Could not resolve tour request');
    }
}

