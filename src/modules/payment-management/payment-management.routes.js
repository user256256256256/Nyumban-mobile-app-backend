import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';

import {
    getRentPaymentsHandler,
    getRentPaymentHandler,
    getPaymentsHandler, 
    getPaymentHandler
} from './payment-management.controller.js'

import { validate } from '../../common/middleware/validate.js';
import {  } from './payment-management.validator.js';

const router = express.Router();

router.get('/landlord/rent-payments', authenticate, getRentPaymentsHandler)
router.get('/rent-payments/:paymentId', authenticate, getRentPaymentHandler)

router.get('/landlord/payments', authenticate, getPaymentsHandler);
router.get('/payments/:paymentId', authenticate, getPaymentHandler);

export default router;
