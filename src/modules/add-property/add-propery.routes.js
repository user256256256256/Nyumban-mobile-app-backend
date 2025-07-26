import express from 'express';
import { authenticate } from '../auth/auth.middleware.js'
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';
import { uploadImage, upload3DTour } from '../../common/middleware/upload.middleware.js';
import {
    addOwnershipInfoHandler, 
    addPhysicalAttributesHandler,
    uploadPropertyThumbnailHandler,
    uploadPropertyImagesHandler,
    uploadPropertyTourHandler, 
    addPropertyUnitHandler,
} from './add-property.controller.js'

import { validate } from '../../common/middleware/validate.middleware.js';
import { propertyOwnershipSchema, propertyPhysicalAttrSchema, propertyImagesSchema,  propertyThumbnailSchema, property3DTourSchema, propertyUnitSchema, } from './add-property.validator.js'

const router = express.Router()


router.post('/ownership', authenticate, authorizeRoles('landlord'), validate(propertyOwnershipSchema), addOwnershipInfoHandler);
router.post('/physical-attributes', authenticate, authorizeRoles('landlord'), validate(propertyPhysicalAttrSchema), addPhysicalAttributesHandler);
router.post('/media/thumbnail', authenticate, authorizeRoles('landlord'), uploadImage.single('thumbnail'), validate(propertyThumbnailSchema), uploadPropertyThumbnailHandler);
router.post('/media/images', authenticate, authorizeRoles('landlord'), uploadImage.array('images', 5), validate(propertyImagesSchema), uploadPropertyImagesHandler);
router.post('/media/3d-tour', authenticate, authorizeRoles('landlord'), upload3DTour.single('tour_3d'), validate(property3DTourSchema), uploadPropertyTourHandler);
router.post('/:propertyId/unit', authenticate, authorizeRoles('landlord'), validate(propertyUnitSchema), addPropertyUnitHandler);

export default router;