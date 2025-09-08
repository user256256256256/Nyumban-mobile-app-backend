// src/modules/agreement-management-landlord/agreement-management-landlord.refund.routes.js
import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';

import { refundSchema } from './refund-payments.validator.js';
import { refundHandler } from './refund-payments.controller.js';

const router = express.Router();

router.post( '/:agreementId/refund', authenticate, authorizeRoles('landlord'), validate(refundSchema), refundHandler );

export default router;
