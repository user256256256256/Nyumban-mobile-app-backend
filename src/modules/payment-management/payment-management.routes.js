import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
    getPaymentsHandler, 
    getPaymentHandler,
} from './payment-management.controller.js'

import { validate } from '../../common/middleware/validate.middleware.js';
import { getPaymentParamSchema } from './payment-management.validator.js';

const router = express.Router();

router.get('/landlord/payments', authenticate, authorizeRoles('landlord'), getPaymentsHandler);
router.get('/payments/:paymentId', authenticate, authorizeRoles('landlord'), validate(getPaymentParamSchema), getPaymentHandler);

export default router;
