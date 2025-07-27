import { success } from '../../common/utils/response-builder.util.js';
import PropertyEngagementService from './property-engagement.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

export const likePropertyHandler = async (req, res) => {
    try {
      const { propertyId } = req.params;
      const userId = req.user.id;
  
      const result = await PropertyEngagementService.likeProperty(userId, propertyId);
      return success(res, result, 'Property liked successfully');
    } catch (error) {
      return handleControllerError(res, error, 'LIKE_PROPERTY_FAILED', 'Failed to like property');
    }
};
  
export const savePropertyHandler = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;

    const result = await PropertyEngagementService.saveProperty(userId, propertyId);
    return success(res, result, 'Property saved successfully');
  } catch (error) {
    return handleControllerError(res, error, 'SAVE_PROPERTY_FAILED', 'Failed to save property');
  }
};

export const unlikePropertyHandler = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;

    const result = await PropertyEngagementService.unlikeProperty(userId, propertyId);
    return success(res, result, 'Property unliked successfully');
  } catch (error) {
    return handleControllerError(res, error, 'UNLIKE_PROPERTY_FAILED', 'Failed to unlike property');
  }
};

export const unsavePropertyHandler = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;

    const result = await PropertyEngagementService.unsaveProperty(userId, propertyId);
    return success(res, result, 'Property unsaved successfully');
  } catch (error) {
    return handleControllerError(res, error, 'UNSAVE_PROPERTY_FAILED', 'Failed to unsave property');
  }
};

export const getLikedPropertiesHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { offset = 0, limit = 10 } = req.query;

    const result = await PropertyEngagementService.getUserEngagedProperties(userId, 'liked', Number(offset), Number(limit));
    return success(res, result, 'Liked properties fetched successfully');
  } catch (error) {
    return handleControllerError(res, error, 'FETCH_LIKED_PROPERTIES_FAILED', 'Failed to fetch liked properties');
  }
};

export const getSavedPropertiesHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { offset = 0, limit = 10 } = req.query;

    const result = await PropertyEngagementService.getUserEngagedProperties(userId, 'saved', Number(offset), Number(limit));
    return success(res, result, 'Saved properties fetched successfully');
  } catch (error) {
    return handleControllerError(res, error, 'FETCH_SAVED_PROPERTIES_FAILED', 'Failed to fetch saved properties');
  }
};

export const getDistanceToPropertyHandler = async (req, res) => {
  try {
    const { property_id, user_latitude, user_longitude } = req.body;
    const result = await PropertyEngagementService.getDistanceToProperty( property_id, user_latitude, user_longitude );
    return success(res, result, 'Distance calculated successfully')
  } catch (error) {
    return handleControllerError(res, error, 'DISTANCE_CALCULATION_FAILED', 'Failed to calculate distance');
  }
}