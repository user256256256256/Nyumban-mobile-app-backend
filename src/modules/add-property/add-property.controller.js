import { success } from '../../common/utils/responseBuilder.js';
import AddPropertyService from './add-property.service.js';
import { handleControllerError } from '../../common/utils/handleControllerError.js';

export const addOwnershipInfoHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await AddPropertyService.addOwnershipInfo({ userId, data: req.body });
        return success(res, result, 'Ownership information saved successfully');
    } catch (error) {
        return handleControllerError(res, error, 'FIALED_TO_SAVE', 'Failed to save ownership info');
    }
}

export const addPhysicalAttributesHandler = async (req, res) => {
    try {
      const userId = req.user.id;
      const propertyId = req.body.property_id;
      const data = req.body;
      const result = await AddPropertyService.addPhysicalAttributes({ userId, propertyId, data });
      return success(res, result, 'Physical attributes added successfully');
    } catch (err) {
      return handleControllerError(res, err, 'FIALED_TO_SAVE', 'Failed to add physical attributes');
    }
};

export const uploadPropertyThumbnailHandler = async (req, res) => {
    try {
      const { file, body: { property_id } } = req;
      if (!file) {
        return handleControllerError(res, err, 'MISSING_FILE', 'Thumbnail file is required');
      }
      const result = await AddPropertyService.uploadPropertyThumbnail(property_id, file);
      return success(res, result, 'Thumbnail uploaded successfully');
    } catch (err) {
      return handleControllerError(res, err, 'UPLOAD_ERROR', 'Failed to upload thumbnail');
    }
};

export const uploadPropertyImagesHandler = async (req, res) => {
    try {
      const { files, body: { property_id } } = req;
      if (!files || files.length === 0) {
        return handleControllerError(res, null, 'MISSING_FILES', 'Image files are required');
      }
      const result = await AddPropertyService.uploadPropertyImages(property_id, files);
      return success(res, result, 'Images uploaded successfully');
    } catch (err) {
      return handleControllerError(res, err, 'UPLOAD_ERROR', 'Failed to upload images');
    }
};
  
export const uploadPropertyTourHandler = async (req, res) => {
    try {
      const { file, body: { property_id } } = req;
      if (!file) {
        return handleControllerError(res, null, 'MISSING_FILE', '3D tour file is required');
      }
      const result = await AddPropertyService.uploadPropertyTour(property_id, file);
      return success(res, result, '3D Tour uploaded successfully');
    } catch (err) {
      return handleControllerError(res, err, 'UPLOAD_ERROR', 'Failed to upload 3D tour');
    }
};
  
export const addPropertyUnitHandler = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const unitData = req.body;
    
    const result = await AddPropertyService.addUnitToProperty(propertyId, unitData );
    return success(res, result, 'Unit added successfully');
  } catch (error) {
    return handleControllerError(res, error, 'ADD_UNIT_ERROR', 'Failed to add unit');
  }
}

