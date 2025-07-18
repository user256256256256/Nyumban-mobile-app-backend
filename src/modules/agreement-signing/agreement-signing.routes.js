import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';

import {
    acceptAgreementHandler,
    processInitialRentPaymentHandler
} from './agreement-signing.controller.js';

import { validate } from '../../common/middleware/validate.js';
import { acceptAgreementSchema, rentPaymentSchema } from './agreement-signing.validator.js';

const router = express.Router();

router.post('/:agreementId/accept', authenticate, validate(acceptAgreementSchema), acceptAgreementHandler)
router.post('/:agreementId/initial-payment', authenticate, validate(rentPaymentSchema), processInitialRentPaymentHandler)

export default router;
