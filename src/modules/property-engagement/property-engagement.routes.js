import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import { 
    likePropertyHandler,
    savePropertyHandler,
    unlikePropertyHandler,
    unsavePropertyHandler,
    getDistanceToPropertyHandler,
    viewPropertyHandler,
} from './property-engagement.controller.js'

import { validate } from '../../common/middleware/validate.middleware.js';
import { propertyIdParamSchema, distanceSchema } from './property-engagement.validator.js'

const router = express.Router()

router.post('/:propertyId/like', authenticate, authorizeRoles('tenant', 'landlord'), validate(propertyIdParamSchema), likePropertyHandler);
router.post('/:propertyId/unlike', authenticate, authorizeRoles('tenant', 'landlord'), validate(propertyIdParamSchema), unlikePropertyHandler);
router.post('/:propertyId/save', authenticate, authorizeRoles('tenant'), validate(propertyIdParamSchema), savePropertyHandler);
router.post('/:propertyId/unsave', authenticate, authorizeRoles('tenant'), validate(propertyIdParamSchema), unsavePropertyHandler);
router.post('/:propertyId/view', authenticate, authorizeRoles('tenant'), validate(propertyIdParamSchema), viewPropertyHandler);
router.post('/distance', authenticate, authorizeRoles('tenant'), validate(distanceSchema), getDistanceToPropertyHandler); 

export default router;