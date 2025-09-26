import { success } from '../../common/utils/response-builder.util.js';
import PropertySearchService from './property-search.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

export const searchPropertiesHandler = async (req, res) => {
  try {
    const filters = {
      ...req.query,
      limit: Number(req.query.limit) || 20,
    };

    console.log('🔍 Search filters received:', filters);

    const result = await PropertySearchService.searchProperties(filters);

    console.log('✅ Search results count:', result.results.length);

    return success(res, result, 'Search results fetched successfully');
  } catch (err) {
    console.error('❌ Search properties error:', err);
    return handleControllerError(res, err, 'SEARCH_ERROR', 'Failed to search properties');
  }
};

export const rankedPropertyFeedHandler = async (req, res) => {
  try {
    const { cursor, limit } = req.query;

    const result = await PropertySearchService.fetchRankedProperties({
      cursor,
      limit: Number(limit) || 20,
    });

    return success(res, result, 'Ranked feed fetched successfully');
  } catch (err) {
    return handleControllerError(res, err, 'FEED_ERROR', 'Failed to load ranked property feed');
  }
};

