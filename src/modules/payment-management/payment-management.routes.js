import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
    getRentPaymentsHandler,
    getRentPaymentHandler,
    getPaymentsHandler, 
    getPaymentHandler
} from './payment-management.controller.js'

import { validate } from '../../common/middleware/validate.middleware.js';
import { rentPaymentParamSchema } from './payment-management.validator.js';

const router = express.Router();

router.get('/landlord/rent-payments', authenticate, authorizeRoles('landlord'), getRentPaymentsHandler);
router.get('/rent-payments/:paymentId', authenticate, authorizeRoles('landlord'), validate(rentPaymentParamSchema), getRentPaymentHandler);
router.get('/landlord/payments', authenticate, authorizeRoles('landlord'), getPaymentsHandler);
router.get('/payments/:paymentId', authenticate, authorizeRoles('landlord'), validate(rentPaymentParamSchema), getPaymentHandler);

export default router;
