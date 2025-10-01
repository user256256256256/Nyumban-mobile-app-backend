
import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
    rentPaymentHandler,
    initialRentPaymentHandler,
} from './rent-payments.controller.js';

import { validate } from '../../common/middleware/validate.middleware.js';
import { initialRentPaymentSchema, rentPaymentSchema  } from './rent-payments.validator.js';

const router = express.Router();

router.post('/:agreementId/rent-payment', authenticate, authorizeRoles('tenant'), validate(rentPaymentSchema), rentPaymentHandler);
router.post('/:agreementId/initial-payment', authenticate, authorizeRoles('tenant'), validate(initialRentPaymentSchema), initialRentPaymentHandler);

export default router;
