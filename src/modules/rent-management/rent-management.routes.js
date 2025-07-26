import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
    getCurrentRentalDetailsHandler,
    initiateRentPaymentHandler,
    getPaymentHistoryHandler,
    getRentStatusHandler,
    checkAdvanceEligibilityHandler
} from './rent-management.controller.js';

import { validate } from '../../common/middleware/validate.middleware.js';
import { initiateRentPaymentSchema, propertyParamSchema  } from './rent-management.validator.js';

const router = express.Router();

router.get('/payments', authenticate, authorizeRoles('tenant'), getPaymentHistoryHandler);
router.get('/properties/:propertyId', authenticate, authorizeRoles('tenant'), validate(propertyParamSchema), getCurrentRentalDetailsHandler);
router.post('/pay', authenticate, authorizeRoles('tenant'), validate(initiateRentPaymentSchema), initiateRentPaymentHandler);
router.get('/status', authenticate, authorizeRoles('tenant'), getRentStatusHandler);
router.get('/advance/check/:propertyId', authenticate, authorizeRoles('tenant'), validate(propertyParamSchema), checkAdvanceEligibilityHandler);

export default router;
