import { success } from '../../common/utils/responseBuilder.js';
import PropertyManagementService from './property-mngt.service.js';
import { handleControllerError } from '../../common/utils/handleControllerError.js';

export const getLandlordPropertiesHandler = async (req, res) => {
    try {
      const { landlordId } = req.params;
      const { sort_by, order, filter_status } = req.query;
  
      const result = await PropertyManagementService.getLandlordProperties({ landlordId, sortBy: sort_by, order, filterStatus: filter_status });
      return success(res, result, 'Properties fetched successfully');
    } catch (error) {
      return handleControllerError(res, error, 'FETCH_PROPERTIES_ERROR', 'Failed to fetch landlord properties');
    }
}

export const getPropertyDetailsHandler = async (req, res) => {
  try {
    const { propertyId } = req.params;

    const result = await PropertyManagementService.getPropertyDetails( propertyId );
    return success(res, result, 'Property details fetched successfully');
  } catch (error) {
    return handleControllerError(res, error, 'FETCH_PROPERTY_DETAILS_FAILED', 'Failed to fetch property details');
  }
}

export const updatePropertyHandler = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const data = req.body;
    const result = await PropertyManagementService.updatePropertyDetails(propertyId, data);
    return success(res, result, 'Property updated successfully');
  } catch (error) {
    return handleControllerError(res, error, 'FAILED_TO_UPDATE', 'Failed to update property');
  }
}

export const updatePropertyThumbnailHandler = async (req, res) => {
  try {
    const { file, body: { property_id } } = req;
    if (!file) {
      return handleControllerError(res, null, 'MISSING_FILE', 'Thumbnail file is required');
    }
    const result = await PropertyManagementService.updatePropertyThumbnail(property_id, file);
    return success(res, result, 'Thumbnail updated successfully');
  } catch (err) {
    return handleControllerError(res, err, 'UPDATE_ERROR', 'Failed to update thumbnail');
  }
};

export const updatePropertyImagesHandler = async (req, res) => {
  try {
    const { files, body: { property_id } } = req;
    if (!files || files.length === 0) {
      return handleControllerError(res, null, 'MISSING_FILES', 'Image files are required');
    }
    const result = await PropertyManagementService.updatePropertyImages(property_id, files);
    return success(res, result, 'Images updated successfully');
  } catch (err) {
    return handleControllerError(res, err, 'UPDATE_ERROR', 'Failed to update images');
  }
};

export const updatePropertyTourHandler = async (req, res) => {
  try {
    const { file, body: { property_id } } = req;
    if (!file) {
      return handleControllerError(res, null, 'MISSING_FILE', '3D tour file is required');
    }
    const result = await PropertyManagementService.updatePropertyTour(property_id, file);
    return success(res, result, '3D Tour updated successfully');
  } catch (err) {
    return handleControllerError(res, err, 'UPDATE_ERROR', 'Failed to update 3D tour');
  }
};

export const updatePropertyUnitHandler = async (req, res) => {
  try {
    const { unitId } = req.params;
    const unitData = req.body;

    const result = await PropertyManagementService.updateUnit(unitId, unitData);
    return success(res, result, 'Unit updated successfully');
  } catch (error) {
    return handleControllerError(res, error, 'UPDATE_UNIT_ERROR', 'Failed to update unit');
  }
};

export const deletePropertyUnitHandler = async (req, res) => {
  try {
    const { unitId } = req.params;
    const result = await PropertyManagementService.deleteUnit(unitId);
    return success(res, result, 'Unit deleted successfully');
  } catch (error) {
    return handleControllerError(res, error, 'DELETE_UNIT_ERROR', 'Failed to delete unit');
  }
};

export const updatePropertyStatusHandler = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { status } = req.body;
    const result = await PropertyManagementService.updatePropertyStatus(propertyId, status);
    return success(res, result, 'Property status updated successfully')
  } catch (error) {
    return handleControllerError(res, error, 'UPDATE_PROPERTY_STATUS_ERROR', 'Failed to update property status');
  }
}

export const updatePropertyUnitStatusHandler = async (req, res) => {
  try {
    const { unitId } = req.params;
    const { status } = req.body;
    const result = await PropertyManagementService.updatePropertyUnitStatus(unitId, status);
    return success(res, result, 'Property unit status updated successfully')
  } catch (error) {
    return handleControllerError(res, error, 'UPDATE_UNIT_STATUS_ERROR', 'Failed to update unit status');
  }
}

export const generateShareLinkHandler = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const result = await PropertyManagementService.generateShareLink(propertyId);
    return success(res, result, 'Share link generated successfully');
  } catch (error) {
    return handleControllerError(res, error, 'SHARE_LINK_ERROR', 'Failed to generate share link');
  }
};

export const confirmOtpAndDeletePropertyHandler = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { otp_code, identifier } = req.body;
    const userId = req.user.id;

    const result = await PropertyManagementService.confirmOtpAndDeleteProperty(userId, propertyId, otp_code, identifier);
    return success(res, result, 'Property deleted successfully');
  } catch (error) {
    return handleControllerError(res, error, 'DELETE_PROPERTY_ERROR', 'Failed to delete property');
  }
};

