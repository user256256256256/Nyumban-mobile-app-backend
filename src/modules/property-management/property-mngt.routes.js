import express from 'express';
import { authenticate } from '../auth/auth.middleware.js'
import { uploadImage, upload3DTour} from '../../common/middleware/upload.middleware.js'
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
    getLandlordPropertiesHandler,
    getPropertyDetailsHandler, 
    updatePropertyHandler,
    updatePropertyThumbnailHandler,
    updatePropertyImagesHandler,
    updatePropertyTourHandler,
    updatePropertyUnitHandler,
    deletePropertyUnitHandler,
    updatePropertyStatusHandler,
    updatePropertyUnitStatusHandler,
    generateShareLinkHandler,
    confirmOtpAndDeletePropertyHandler,
} from './property-mngt.controller.js'

import { validate } from '../../common/middleware/validate.middleware.js';
import { landlordPropertySchema, getPropertyDetailsSchema, editPropertySchema, unitParamSchema, propertyThumbnailSchema, propertyImagesSchema, property3DTourSchema, editpropertyUnitSchema, updatePropertyStatusSchema, updateUnitStatusSchema } from './property-mngt.validator.js'

const router = express.Router()


router.get('/:landlordId/properties', authenticate, authorizeRoles('landlord'), validate(landlordPropertySchema), getLandlordPropertiesHandler);
router.get('/:propertyId/details', authenticate, authorizeRoles('landlord'), validate(getPropertyDetailsSchema), getPropertyDetailsHandler);
router.put('/:propertyId/edit', authenticate, authorizeRoles('landlord'), validate(editPropertySchema), updatePropertyHandler);
router.put('/media/thumbnail', authenticate, authorizeRoles('landlord'), uploadImage.single('thumbnail'), validate(propertyThumbnailSchema), updatePropertyThumbnailHandler);
router.put('/media/images', authenticate, authorizeRoles('landlord'), uploadImage.array('images', 5), validate(propertyImagesSchema), updatePropertyImagesHandler);
router.put('/media/3d-tour', authenticate, authorizeRoles('landlord'), uploadImage.single('tour_3d'), validate(property3DTourSchema), updatePropertyTourHandler);
router.put('/unit/:unitId/edit', authenticate, authorizeRoles('landlord'), validate(editpropertyUnitSchema), updatePropertyUnitHandler);
router.delete('/unit/:unitId/remove', authenticate, authorizeRoles('landlord'), validate(unitParamSchema), deletePropertyUnitHandler);
router.patch('/:propertyId/status', authenticate, authorizeRoles('landlord'), validate(updatePropertyStatusSchema), updatePropertyStatusHandler);
router.patch('/unit/:unitId/status', authenticate, authorizeRoles('landlord'), validate(updateUnitStatusSchema), updatePropertyUnitStatusHandler);
router.get('/:propertyId/share-link', authenticate, authorizeRoles('landlord'), validate(getPropertyDetailsSchema), generateShareLinkHandler);
router.delete('/:propertyId/remove', authenticate, authorizeRoles('landlord'), confirmOtpAndDeletePropertyHandler);

export default router;