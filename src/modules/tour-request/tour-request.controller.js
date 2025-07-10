import { success } from '../../common/utils/responseBuilder.js';
import TourRequestService from './tour-request.service.js';
import { handleControllerError } from '../../common/utils/handleControllerError.js';

export const tourRequestHandler = async (req, res) => {
    try {
        const requesterId = req.user.id;
        const { propertyId, message } = req.body;
        const result = await TourRequestService.tourRequest(requesterId, propertyId, message)
        return success(res, result, "Tour request sent successfully")
    } catch (error) {
        return handleControllerError(res, error, 'TOUR_REQUEST_ERROR', 'Failed to request tour');
    }
}

export const getTourRequestsHandler = async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await TourRequestService.getTourRequests(userId);
      return success(res, result, 'Tour requests retrieved successfully');
    } catch (error) {
      handleControllerError(res, error, 'GET_TOUR_REQUESTS_ERROR', 'Failed to get tour requests');
    }
};
  

export const cancelTourRequestHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tour_id } = req.body;
    const result = await TourRequestService.cancelTourRequest(userId, tour_id);
    return success(res, result, 'Tour request cancelled successfully');
  } catch (error) {
    handleControllerError(res, error, 'TOUR_CANCEL_ERROR', 'Failed to cancel tour request');
  }
};