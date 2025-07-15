import express from 'express';
import { authenticate } from '../auth/auth.middleware.js'

import { 
    likePropertyHandler,
    savePropertyHandler,
    unlikePropertyHandler,
    unsavePropertyHandler,
    getLikedPropertiesHandler,
    getSavedPropertiesHandler,
    getDistanceToPropertyHandler
} from './property-engagement.controller.js'

import { validate } from '../../common/middleware/validate.js';
import { propertyIdParamSchema, paginationSchema, distanceSchema } from './property-engagement.validator.js'

const router = express.Router()

router.post('/:propertyId/like', authenticate, validate(propertyIdParamSchema, 'params'), likePropertyHandler);
router.post('/:propertyId/unlike', authenticate, validate(propertyIdParamSchema, 'params'), unlikePropertyHandler);

router.post('/:propertyId/save', authenticate, validate(propertyIdParamSchema, 'params'), savePropertyHandler);
router.post('/:propertyId/unsave', authenticate, validate(propertyIdParamSchema, 'params'), unsavePropertyHandler);

router.get('/liked', authenticate, validate(paginationSchema, 'query'), getLikedPropertiesHandler);
router.get('/saved', authenticate, validate(paginationSchema, 'query'), getSavedPropertiesHandler);

router.post('/distance', authenticate, validate(distanceSchema), getDistanceToPropertyHandler)

export default router;