import express from 'express';
import { authenticate } from '../auth/auth.middleware.js'

import {
    checkLandlordVerificationStatusHandler,
    getPromotionPlansHandler,
    promotePropertyHandler,
    getPropertyPromotionStatusHandler,
} from './property-promotion.controller.js'

import { validate } from '../../common/middleware/validate.js';
import { promotionRequestSchema } from './property-promotion.validator.js'

const router = express.Router();

router.get('/verification-status', authenticate, checkLandlordVerificationStatusHandler)
router.get('/promotion-plans', getPromotionPlansHandler)
router.post('/properties/:propertyId/promote', authenticate, validate(promotionRequestSchema), promotePropertyHandler)
router.get('/properties/:propertyId/status', authenticate, getPropertyPromotionStatusHandler )
// get property promotions

export default router;