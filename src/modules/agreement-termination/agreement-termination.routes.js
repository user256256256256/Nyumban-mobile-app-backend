import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { uploadProofDocument } from '../../common/middleware/upload.middleware.js'

import {
  terminateAgreementHandler,
  cancelEvictionHandler,
  confirmEvictionHandler,
  breachAdminReviewHandler,
  confirmBreachEvictionHandler,
  acceptMutualTerminationHandler,
  cancelMutualTerminationHandler,
  resolveBreachByLandlordHandler,
  cancelOwnerRequirementTerminationHandler,
} from './agreement-termination.controller.js';

import {terminateAgreementSchema, cancelEvictionSchema, confirmEvictionSchema, breachAdminReviewSchema, resolveBreachEvictionSchema, acceptMutualTerminationSchema, cancelOwnerRequirementTerminationSchema } from './agreement-termination.validator.js'

const router = express.Router();

router.post('/:agreementId/terminate', authenticate, authorizeRoles('landlord', 'tenant'), uploadProofDocument.single('proof_of_agreement_breach_docs'), validate(terminateAgreementSchema), terminateAgreementHandler );
router.post('/:evictionId/cancel', authenticate, authorizeRoles('landlord', 'admin'), validate(cancelEvictionSchema), cancelEvictionHandler );
router.patch('/:evictionId/confirm', authenticate, validate(confirmEvictionSchema), authorizeRoles('landlord', 'admin'), confirmEvictionHandler );
router.post('/:breachLogId/admin-review-response', authenticate, authorizeRoles('admin'), validate(breachAdminReviewSchema), breachAdminReviewHandler );
router.patch('/:agreementId/breach-confirm', authenticate,authorizeRoles('landlord'), validate(resolveBreachEvictionSchema), confirmBreachEvictionHandler );
router.patch('/:agreementId/breach-resolve', authenticate, authorizeRoles('landlord'), validate(resolveBreachEvictionSchema), resolveBreachByLandlordHandler );
router.patch('/:agreementId/owner-requirement-cancel', authenticate,  authorizeRoles('landlord'), validate(cancelOwnerRequirementTerminationSchema),  cancelOwnerRequirementTerminationHandler );
router.post('/:agreementId/mutual-accept', authenticate, authorizeRoles('landlord', 'tenant'), validate(acceptMutualTerminationSchema), acceptMutualTerminationHandler );
router.patch('/:agreementId/mutual-cancel',authenticate, authorizeRoles('landlord', 'tenant'), cancelMutualTerminationHandler );

export default router;