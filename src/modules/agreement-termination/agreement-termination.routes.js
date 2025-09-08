import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import {
  terminateAgreementHandler,
  cancelEvictionHandler,
  confirmEvictionHandler,
  breachAdminReviewHandler,
  confirmBreachEvictionHandler,
  acceptMutualTerminationHandler,
  cancelMutualTerminationHandler,
} from './agreement-termination.controller.js';

import {terminateAgreementSchema, cancelEvictionSchema, confirmEvictionSchema, breachAdminReviewSchema, confirmBreachEvictionSchema, acceptMutualTerminationSchema } from './agreement-termination.validator.js'

const router = express.Router();

router.post('/:agreementId/terminate', authenticate, authorizeRoles('landlord', 'tenant'), validate(terminateAgreementSchema), terminateAgreementHandler );
router.post('/:evictionId/cancel', authenticate, authorizeRoles('landlord', 'admin'), validate(cancelEvictionSchema), cancelEvictionHandler );
router.post('/confirm-eviction', validate(confirmEvictionSchema), authorizeRoles('landlord', 'admin'), confirmEvictionHandler );
router.post('/breach/:breachLogId/review', authenticate, authorizeRoles('admin'), validate(breachAdminReviewSchema), breachAdminReviewHandler );
router.post('/:agreementId/breach/confirm', authenticate,authorizeRoles('landlord'), validate(confirmBreachEvictionSchema), confirmBreachEvictionHandler );
router.post('/:agreementId/mutual-accept', authenticate, authorizeRoles('landlord', 'tenant'), validate(acceptMutualTerminationSchema), acceptMutualTerminationHandler );
router.post('/:agreementId/mutual-cancel',authenticate, authorizeRoles('landlord', 'tenant'), cancelMutualTerminationHandler );

export default router;