import { success } from '../../common/utils/response-builder.util.js';
import AnalyticsService from './analytics.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

export const getPropertyAnalyticsHandler = async (req, res) => {
    try {
      const { propertyIds } = req.body;
  
      const data = await AnalyticsService.getPropertyAnalytics(propertyIds);
  
      return success(res, data, 'Property analytics fetched successfully');
    } catch (error) {
      return handleControllerError(res, error, 'FETCH_ANALYTICS_ERROR', 'Failed to fetch property analytics');
    }
};