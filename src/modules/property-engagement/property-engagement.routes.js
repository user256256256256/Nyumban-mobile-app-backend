import express from 'express';
import { authenticate } from '../auth/auth.middleware.js'
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import { 
    likePropertyHandler,
    savePropertyHandler,
    unlikePropertyHandler,
    unsavePropertyHandler,
    getLikedPropertiesHandler,
    getSavedPropertiesHandler,
    getDistanceToPropertyHandler
} from './property-engagement.controller.js'

import { validate } from '../../common/middleware/validate.middleware.js';
import { propertyIdParamSchema, paginationSchema, distanceSchema } from './property-engagement.validator.js'

const router = express.Router()


router.post('/:propertyId/like', authenticate, authorizeRoles('tenant'), validate(propertyIdParamSchema), likePropertyHandler);
router.post('/:propertyId/unlike', authenticate, authorizeRoles('tenant'), validate(propertyIdParamSchema), unlikePropertyHandler);
router.post('/:propertyId/save', authenticate, authorizeRoles('tenant'), validate(propertyIdParamSchema), savePropertyHandler);
router.post('/:propertyId/unsave', authenticate, authorizeRoles('tenant'), validate(propertyIdParamSchema), unsavePropertyHandler);
router.get('/liked', authenticate, authorizeRoles('tenant'), validate(paginationSchema, 'query'), getLikedPropertiesHandler);
router.get('/saved', authenticate, authorizeRoles('tenant'), validate(paginationSchema, 'query'), getSavedPropertiesHandler);
router.post('/distance', authenticate, authorizeRoles('tenant'), validate(distanceSchema), getDistanceToPropertyHandler); 

export default router;