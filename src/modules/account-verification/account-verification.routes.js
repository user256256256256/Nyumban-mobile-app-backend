import express from 'express';
import { authenticate } from '../auth/auth.middleware.js'
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';
import { uploadProofDocument } from '../../common/middleware/upload.middleware.js'

import {
    getLandlordAccountStatusHandler, 
    submitVerificationRequestHandler,
    getPropertyVerificationStatusHandler,
    reviewVerificationRequestHandler,
    submitVerificationBadgePaymentHandler,
    updateVerificationRequestHandler,
} from './account-verification.controller.js'

import { validate } from '../../common/middleware/validate.middleware.js';
import { verificationRequestSchema, adminVerificationRequestResponseSchema, verificationBadgePaymentSchema, propertyVerificationStatusParamSchema, updateVerificationRequestSchema } from './account-verification.validator.js'

const router = express.Router();

router.get('/status', authenticate, authorizeRoles('landlord'), getLandlordAccountStatusHandler);
router.post('/verification-request', authenticate, authorizeRoles('landlord'), uploadProofDocument.single('proof_of_ownership_docs'), validate(verificationRequestSchema), submitVerificationRequestHandler);
router.get('/properties/:propertyId/status', authenticate, authorizeRoles('landlord'), validate(propertyVerificationStatusParamSchema), getPropertyVerificationStatusHandler);
router.patch('/admin/:requestId', authenticate, authorizeRoles('admin'), validate(adminVerificationRequestResponseSchema), reviewVerificationRequestHandler);
router.post('/landlords/verification-payment', authenticate, authorizeRoles('landlord'), validate(verificationBadgePaymentSchema), submitVerificationBadgePaymentHandler);
router.post('/verification-requests/:requestId/update', authenticate, authorizeRoles('landlord'),  uploadProofDocument.single('proof_of_ownership_docs'), validate(updateVerificationRequestSchema), updateVerificationRequestHandler)

export default router;
