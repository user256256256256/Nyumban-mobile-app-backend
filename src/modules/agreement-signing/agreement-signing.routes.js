import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
    acceptAgreementHandler,
    processInitialRentPaymentHandler
} from './agreement-signing.controller.js';

import { validate } from '../../common/middleware/validate.middleware.js';
import { acceptAgreementSchema, rentPaymentSchema } from './agreement-signing.validator.js';

const router = express.Router();

router.post('/:agreementId/accept', authenticate, authorizeRoles('tenant', 'landlord'), validate(acceptAgreementSchema), acceptAgreementHandler);
router.post('/:agreementId/initial-payment', authenticate, authorizeRoles('tenant', 'landlord'), validate(rentPaymentSchema), processInitialRentPaymentHandler);

export default router;
