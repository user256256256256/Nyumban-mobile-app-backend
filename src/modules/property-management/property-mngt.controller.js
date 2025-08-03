import { success } from '../../common/utils/response-builder.util.js';
import PropertyManagementService from './property-mngt.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

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
    const { property_ids, otp_code, identifier } = req.body;
    const userId = req.user.id;

    const result = await PropertyManagementService.confirmOtpAndDeleteProperty(userId, property_ids, otp_code, identifier);
    return success(res, result, 'Properties deleted successfully');
  } catch (error) {
    return handleControllerError(res, error, 'DELETE_PROPERTY_ERROR', 'Failed to delete properties');
  }
};


export const permanentlyDeletePropertyHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { property_ids } = req.body;

    const result = await PropertyManagementService.permanentlyDeleteProperty(userId, property_ids);
    return success(res, result, 'Properties permanently deleted successfully');
  } catch (error) {
    return handleControllerError(res, error, 'DELETE_PROPERTY_PERMANENTLY_ERROR', 'Failed to delete properties permanently');
  }
};

export const permanentlyDeleteAllArchivedPropertiesHandler = async (req, res) => {
  try {
    const userId = req.user.id; 
    const result = await PropertyManagementService.permanentlyDeleteAllArchivedProperties(userId);
    return success(res, result, 'All permanently deleted successfully')
  } catch (error) {
    return handleControllerError(res, error, 'DELETE_PROPERTY_PERMANETLY_ERROR', 'Failed to delete properties permanently');
  }
}

export const deletePropertyImagesHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageIds } = req.body; 
    
    const result = await PropertyManagementService.deletePropertyImages(userId, imageIds);

    return success(res, result, 'Property images deleted successfully');
  } catch (error) {
    return handleControllerError(res, error, 'DELETE_PROPERTY_IMAGES_ERROR', 'Failed to delete property images');
  }
};

export const deleteSelectedPropertyUnitsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { unitIds } = req.body;

    const result = await PropertyManagementService.deleteSelectedUnits(userId, unitIds);
    return success(res, result, 'Selected property units deleted successfully');
  } catch (error) {
    return handleControllerError(res, error, 'DELETE_PROPERTY_UNITS_BATCH_ERROR', 'Failed to delete selected units');
  }
};

export const permanentlyDeleteSelectedUnitsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { unitIds } = req.body;

    const result = await PropertyManagementService.permanentlyDeleteSelectedUnits(userId, unitIds);
    return success(res, result, 'Selected units permanently deleted');
  } catch (error) {
    return handleControllerError(res, error, 'PERMANENT_DELETE_SELECTED_UNITS_ERROR', 'Failed to delete selected units');
  }
};

export const permanentlyDeleteAllArchivedUnitsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await PropertyManagementService.permanentlyDeleteAllArchivedUnits(userId);
    return success(res, result, 'All archived units permanently deleted');
  } catch (error) {
    return handleControllerError(res, error, 'PERMANENT_DELETE_ALL_UNITS_ERROR', 'Failed to delete archived units');
  }
};

export const recoverPropertiesHandler = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const { property_ids } = req.body;

    const result = await PropertyService.recoverPropertiesBatch(property_ids, landlordId);
    return success(res, result, 'Properties recovered successfully');
  } catch (error) {
    return handleControllerError(res, error, 'PROPERTY_RECOVERY_ERROR', 'Failed to recover properties');
  }
};

export const recoverUnitsHandler = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const { unit_ids } = req.body;

    const result = await UnitService.recoverUnitsBatch(unit_ids, landlordId);
    return success(res, result, 'Units recovered successfully');
  } catch (error) {
    return handleControllerError(res, error, 'UNIT_RECOVERY_ERROR', 'Failed to recover units');
  }
};

export const deleteProperty3DTourHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const propertyId = req.params.propertyId;

    const result = await PropertyManagementService.delete3DTour(userId, propertyId);
    return success(res, result, '3D tour deleted successfully');
  } catch (error) {
    return handleControllerError(res, error, 'DELETE_3D_TOUR_ERROR', 'Failed to delete 3D tour');
  }
};

export const deletePropertyThumbnailHandler = async (req, res, next) => {
  try {
    const userId = req.user.id; // Assuming req.user set by auth middleware
    const { propertyId } = req.params;
    const result = await PropertyManagementService.deletePropertyThumbnail(userId, propertyId);
    return success(res, result, 'Property thumbnail deleted successfully');

  } catch (error) {
    return handleControllerError(res, error, 'DELETE_THUMBNAIL_ERROR', 'Failed to delete property thumbnail');
  }
};

export const getPropertyUnitsHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { propertyId } = req.params;
    const { sortBy, order } = req.query;

    const result = await PropertyManagementService.getPropertyUnits(userId, propertyId, sortBy, order);

    return success(res, result, 'Property units fetched successfully');
  } catch (error) {
    return handleControllerError(res, error, 'GET_PROPERTY_UNITS_ERROR', 'Failed to fetch property units');
  }
};


export const getPropertyUnitHandler = async (req, res, next) => {
  try {
    const { unitId } = req.params;

    const result = await PropertyManagementService.getPropertyUnit(unitId);

    return success(res, result, 'Property unit fetched successfully');
  } catch (error) {
    return handleControllerError(res, error, 'GET_PROPERTY_UNIT_ERROR', 'Failed to fetch property unit');
  }
};
