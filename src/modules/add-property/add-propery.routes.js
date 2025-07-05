import express from 'express';
import { authenticate } from '../auth/auth.middleware.js'
import { uploadImage, upload3DTour } from '../../common/middleware/upload.middleware.js';
import {
    addOwnershipInfoHandler, 
    addPhysicalAttributesHandler,
    uploadPropertyThumbnailHandler,
    uploadPropertyImagesHandler,
    uploadPropertyTourHandler, 
    addPropertyUnitHandler,
} from './add-property.controller.js'

import { validate } from '../../common/middleware/validate.js';
import { propertyOwnershipSchema, propertyPhysicalAttrSchema, propertyImagesSchema,  propertyThumbnailSchema, property3DTourSchema, propertyUnitSchema, } from './add-property.validator.js'

const router = express.Router()
router.post('/ownership', authenticate, validate(propertyOwnershipSchema), addOwnershipInfoHandler )
router.post('/physical-attributes', authenticate, validate(propertyPhysicalAttrSchema), addPhysicalAttributesHandler)
router.post('/media/thumbnail', authenticate, uploadImage.single('thumbnail'), validate(propertyThumbnailSchema), uploadPropertyThumbnailHandler)
router.post('/media/images', authenticate, uploadImage.array('images', 5), validate(propertyImagesSchema), uploadPropertyImagesHandler)
router.post('/media/3d-tour', authenticate, upload3DTour.single('tour_3d'), validate(property3DTourSchema), uploadPropertyTourHandler)
router.post('/:propertyId/unit', authenticate, validate(propertyUnitSchema), addPropertyUnitHandler)

export default router;