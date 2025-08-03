import { success } from '../../common/utils/response-builder.util.js';
import TourRequestService from './tour-request.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

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
    const { status, cursor, limit } = req.query;

    const result = await TourRequestService.getTourRequests(userId, {
      status,
      cursor,
      limit: Number(limit) || 20,
    });

    return success(res, result, 'Tour requests retrieved successfully');
  } catch (error) {
    handleControllerError(res, error, 'GET_TOUR_REQUESTS_ERROR', 'Failed to get tour requests');
  }
};


  
export const cancelTourRequestsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tour_ids } = req.body;

    const result = await TourRequestService.cancelTourRequests(userId, tour_ids);
    return success(res, result, 'Tour requests cancelled successfully');
  } catch (error) {
    handleControllerError(res, error, 'TOUR_CANCEL_ERROR', 'Failed to cancel tour requests');
  }
};

export const deleteTourRequestsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tour_ids } = req.body;

    const result = await TourRequestService.deleteTourRequests(userId, tour_ids);
    return success(res, result, 'Tour requests cancelled successfully');
  } catch (error) {
    handleControllerError(res, error, 'TOUR_CANCEL_ERROR', 'Failed to cancel tour requests');
  }
};
