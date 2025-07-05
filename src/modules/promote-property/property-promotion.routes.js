import express from 'express';
import { authenticate } from '../auth/auth.middleware.js'

import {
    checkLandlordVerificationStatusHandler,
} from './property-promotion.controller.js'

import { validate } from '../../common/middleware/validate.js';
import {  } from './property-promotion.validator.js'

const router = express.Router();

router.get('/verification-status', authenticate, checkLandlordVerificationStatusHandler)

export default router;