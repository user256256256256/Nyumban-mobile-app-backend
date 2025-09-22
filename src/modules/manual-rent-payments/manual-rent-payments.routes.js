import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
    markManualPaymentHandler,
    markManualInitialRentPaymentHandler
} from './manual-rent-payments.controller.js'

import { validate } from '../../common/middleware/validate.middleware.js';
import { manualRentPaymentSchema, initialManualRentPaymentSchema } from './manual-rent-payments.validator.js';

const router = express.Router();


router.post('/tenants/:tenantId/payment', authenticate, authorizeRoles('landlord'), validate(manualRentPaymentSchema), markManualPaymentHandler);
router.post('/:agreementId/manual-initial-payment', authenticate, authorizeRoles('landlord'), validate(initialManualRentPaymentSchema), markManualInitialRentPaymentHandler);
  
export default router;
