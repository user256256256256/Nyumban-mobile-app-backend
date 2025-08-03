import { success } from '../../common/utils/response-builder.util.js';
import ApplicationRequestService from './application-request.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

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
    const { status } = req.query; // ?status=pending

    const result = await ApplicationRequestService.getApplicationRequests(userId, status);
    return success(res, result, 'Application requests retrieved successfully');
  } catch (error) {
    handleControllerError(res, error, 'GET_APPLICATION_REQUEST_ERROR', 'Failed to get application requests.');
  }
};


export const cancelApplicationBatchRequestHandler = async (req, res) => {
    try {
      const userId = req.user.id;
      const { application_ids } = req.body;
  
      const result = await ApplicationRequestService.cancelApplicationBatch(userId, application_ids);
      return success(res, result, 'Applications cancelled successfully');
    } catch (error) {
      handleControllerError(res, error, 'APPLICATION_BATCH_CANCEL_ERROR', 'Failed to cancel applications');
    }
};
  
export const deleteApplicationBatchRequestHandler = async (req, res) => {
    try {
      const userId = req.user.id;
      const { application_ids } = req.body;
  
      const result = await ApplicationRequestService.deleteApplicationBatch(userId, application_ids);
      return success(res, result, 'Applications deleted successfully');
    } catch (error) {
      handleControllerError(res, error, 'APPLICATION_BATCH_DELETE_ERROR', 'Failed to delete applications');
    }
};
  