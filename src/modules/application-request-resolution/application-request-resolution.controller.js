import { success } from '../../common/utils/response-builder.util.js';
import ApplicationRequestResolutionService from './application-request-resolution.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

export const getLandlordApplicationRequestsHandler = async (req, res) => {
    try {
      const landlordId = req.user.id;
      const { status, cursor, limit } = req.query;
  
      const result = await ApplicationRequestResolutionService.getLandlordApplicationRequests(landlordId, {
        status,
        cursor,
        limit: Number(limit) || 20,
      });
  
      return success(res, result, 'Landlord Property Application requests retrieved successfully');
    } catch (error) {
      return handleControllerError(res, error, 'GET_APPLICATION_REQUESTS_ERROR', 'Failed to get landlord properties application requests');
    }
  };
  
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

export const orchestrateApplicationResolutionHandler = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const { applicationId } = req.params;
    const { action, reason } = req.body;

    const result = await ApplicationRequestResolutionService.orchestrateApplicationResolution(landlordId, applicationId, action, reason);
    return success(res, result, 'Application request processed with rollback if needed successfully');
  } catch (error) {
    return handleControllerError(res, error, 'ORCHESTRATE_APPLICATION_RESOLUTION_ERROR', 'Could not orchestrate application resolution');
  }
};


export const deleteApplicationRequestsHandler = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const { applicationIds } = req.body;

    const result = await ApplicationRequestResolutionService.deleteApplicationRequests(landlordId, applicationIds)
    return success(res, result, 'Application requests deleted successfully')
  } catch (error) {
    return handleControllerError(res, error, 'DELETE_APPLICATION_REQUESTS_ERROR', 'Could not delete application request(s)' )
  }
}
