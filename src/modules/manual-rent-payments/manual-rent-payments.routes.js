import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';

import {
    markManualPaymentHandler,
} from './manual-rent-payments.controller.js'

import { validate } from '../../common/middleware/validate.js';
import { manualRentPaymentSchema } from './manual-rent-payments.validator.js';

const router = express.Router();

router.post('/tenants/:tenantId/payments/manual', authenticate, validate(manualRentPaymentSchema), markManualPaymentHandler);

export default router;
