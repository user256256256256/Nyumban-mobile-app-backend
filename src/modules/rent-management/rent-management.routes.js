import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';

import {
    getCurrentRentalDetailsHandler,
    initiateRentPaymentHandler,
    getPaymentHistoryHandler
} from './rent-management.controller.js';

import { validate } from '../../common/middleware/validate.js';
import { initiateRentPaymentSchema } from './rent-management.validator.js';

const router = express.Router();

router.get('/payments', authenticate, getPaymentHistoryHandler);
router.get('/properties/:propertyId', authenticate, getCurrentRentalDetailsHandler);
router.post('/pay', authenticate, validate(initiateRentPaymentSchema), initiateRentPaymentHandler)


export default router;
