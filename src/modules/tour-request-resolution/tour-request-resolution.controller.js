import { success } from '../../common/utils/response-builder.util.js';
import TourRequestResolutionService from './tour-request-resolution.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

export const getLandlordTourRequestsHandler = async (req, res) => {
    try {
        const landlordId = req.user.id;
        const { status, cursor, limit } = req.query;
    
        const result = await TourRequestResolutionService.getLandlordTourRequests(landlordId, {
          status,
          cursor,
          limit: Number(limit) || 20,
        });
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

export const deleteTourRequestsHandler = async (req, res) => {
    try {
      const landlordId = req.user.id;
      const { requestIds } = req.body;
  
      const result = await TourRequestResolutionService.deleteTourRequests(landlordId, requestIds);
      return success(res, result, 'Tour requests deleted successfully');
    } catch (error) {
      return handleControllerError(res, error, 'DELETE_TOUR_REQUESTS_ERROR', 'Could not delete tour request(s)');
    }
};
  