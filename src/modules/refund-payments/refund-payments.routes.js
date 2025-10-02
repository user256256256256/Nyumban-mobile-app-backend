// src/modules/agreement-management-landlord/refund-payments.routes.js
import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';

import { processSecurityDepositRefundHandler, processAdvanceRentRefundHandler } from './refund-payments.controller.js';
import { refundSchema } from './refund-payments.validator.js';

const router = express.Router();

router.post('/:agreementId/security-deposit/refund', authenticate, authorizeRoles('landlord'), validate(refundSchema), processSecurityDepositRefundHandler );
router.post('/:agreementId/advance-rent/refund', authenticate,  authorizeRoles('landlord'),  validate(refundSchema),  processAdvanceRentRefundHandler );

export default router;
