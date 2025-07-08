import express from 'express';
import { authenticate } from '../auth/auth.middleware.js'
import { uploadProofDocument } from '../../common/middleware/upload.middleware.js'

import {
    getLandlordAccountStatusHandler, 
    submitVerificationRequestHandler,
    getPropertyVerificationStatusHandler,
    reviewVerificationRequestHandler,
    submitVerificationBadgePaymentHandler
} from './account-verification.controller.js'

import { validate } from '../../common/middleware/validate.js';
import { verificationRequestSchema, adminVerificationRequestResponseSchema, verificationBadgePaymentSchema } from './account-verification.validator.js'

const router = express.Router();

router.get('/status', authenticate, getLandlordAccountStatusHandler)
router.post('/verification-request', authenticate, uploadProofDocument.single('proof_of_ownership_docs'), validate(verificationRequestSchema), submitVerificationRequestHandler)
router.get('/properties/:propertyId/status', authenticate, getPropertyVerificationStatusHandler)
router.patch('/admin/:requestId', authenticate, validate(adminVerificationRequestResponseSchema), reviewVerificationRequestHandler)
router.post('/lanlords/verification-payment', authenticate, validate(verificationBadgePaymentSchema), submitVerificationBadgePaymentHandler)

export default router;
