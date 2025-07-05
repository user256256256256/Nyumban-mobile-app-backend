import express from 'express';
import { authenticate } from '../auth/auth.middleware.js'
import { uploadImage, upload3DTour} from '../../common/middleware/upload.middleware.js'
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

import { validate } from '../../common/middleware/validate.js';
import { landlordPropertyQuerySchema, getPropertyDetailsSchema, editPropertySchema, propertyThumbnailSchema, propertyImagesSchema, property3DTourSchema, editpropertyUnitSchema, updatePropertyStatusSchema, updateUnitStatusSchema } from './property-mngt.validator.js'

const router = express.Router()

router.get('/:landlordId/properties', authenticate, validate(landlordPropertyQuerySchema), getLandlordPropertiesHandler)
router.get('/:propertyId/details', authenticate, validate(getPropertyDetailsSchema, 'params'), getPropertyDetailsHandler)
router.put('/:propertyId/edit', authenticate, validate(editPropertySchema),  updatePropertyHandler);
router.put('/media/thumbnail', authenticate, uploadImage.single('thumbnail'), validate(propertyThumbnailSchema), updatePropertyThumbnailHandler)
router.put('/media/images', authenticate, uploadImage.array('images', 5), validate(propertyImagesSchema), updatePropertyImagesHandler)
router.put('/media/3d-tour', authenticate, uploadImage.single('tour_3d'), validate(property3DTourSchema), updatePropertyTourHandler)
router.put('/unit/:unitId/edit', authenticate, validate(editpropertyUnitSchema),  updatePropertyUnitHandler);
router.delete('/unit/:unitId/remove', authenticate, deletePropertyUnitHandler);
router.patch('/:propertyId/status', authenticate, validate(updatePropertyStatusSchema), updatePropertyStatusHandler);
router.patch('/unit/:unitId/status', authenticate, validate(updateUnitStatusSchema), updatePropertyUnitStatusHandler)
router.get('/:propertyId/share-link', authenticate, validate(getPropertyDetailsSchema, 'params'), generateShareLinkHandler);
router.delete('/:propertyId/remove', authenticate, confirmOtpAndDeletePropertyHandler)

export default router;