import express from 'express';
import { authenticate } from '../auth/auth.middleware.js'
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
    checkLandlordVerificationStatusHandler,
    getPromotionPlansHandler,
    promotePropertyHandler,
    getPropertyPromotionStatusHandler,
} from './property-promotion.controller.js'

import { validate } from '../../common/middleware/validate.middleware.js';
import { promotionRequestSchema, propertyParamSchema } from './property-promotion.validator.js'

const router = express.Router();

router.get('/promotion-plans', getPromotionPlansHandler)
router.get('/verification-status', authenticate, authorizeRoles('landlord'), checkLandlordVerificationStatusHandler);
router.post('/properties/:propertyId/promote', authenticate, authorizeRoles('landlord'), validate(promotionRequestSchema), promotePropertyHandler);
router.get('/properties/:propertyId/status', authenticate, authorizeRoles('landlord'), validate(propertyParamSchema), getPropertyPromotionStatusHandler);

export default router;