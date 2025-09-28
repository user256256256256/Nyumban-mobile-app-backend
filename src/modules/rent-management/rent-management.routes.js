import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
    getCurrentRentalDetailsHandler,
    initiateRentPaymentHandler,
    getPaymentHistoryHandler,
    getRentStatusHandler,
    getRentAndDepositHandler,
} from './rent-management.controller.js';

import { validate } from '../../common/middleware/validate.middleware.js';
import { initiateRentPaymentSchema, propertyParamSchema  } from './rent-management.validator.js';

const router = express.Router();

router.get('/payments', authenticate, authorizeRoles('tenant'), getPaymentHistoryHandler);
router.get('/properties/:propertyId', authenticate, authorizeRoles('tenant'), validate(propertyParamSchema), getCurrentRentalDetailsHandler);
router.post('/pay', authenticate, authorizeRoles('tenant'), validate(initiateRentPaymentSchema), initiateRentPaymentHandler);
router.get('/status/:propertyId', authenticate, authorizeRoles('tenant'), getRentStatusHandler);
router.get('/properties/:propertyId/rent-and-deposit', authenticate, authorizeRoles('tenant'), validate(propertyParamSchema), getRentAndDepositHandler);


export default router;
