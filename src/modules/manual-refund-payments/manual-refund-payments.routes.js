import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';

import { 
    processManualRefundHandler,
    processAdvanceRentRefundHandler, 
} from './manual-refund-payments.controller.js';

import { manualRefundSchema, advanceRentRefundSchema } from './manual-refund-payments.validator.js';

const router = express.Router();

router.post('/:agreementId/security-deposit/refund', authenticate, authorizeRoles('landlord'), validate(manualRefundSchema), processManualRefundHandler );
router.post('/:agreementId/advance-rent/refund', authenticate, authorizeRoles('landlord'), validate(advanceRentRefundSchema), processAdvanceRentRefundHandler  );
  
export default router;
