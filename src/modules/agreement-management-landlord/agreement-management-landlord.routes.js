import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';

import {
    getAllLandlordAgreementsHandler,
    generateAgreementShareLinkHandler,
    downloadAgreementPdfHandler,
    terminateAgreementHandler
} from './agreement-management-landlord.controller.js';

import { validate } from '../../common/middleware/validate.js';
import { shareAgreementSchema, terminateAgreementSchema } from './agreement-management-landlord.validator.js';

const router = express.Router();

router.get('/agreements', authenticate, getAllLandlordAgreementsHandler)
router.post('/:agreementId/share', authenticate, validate(shareAgreementSchema), generateAgreementShareLinkHandler)
router.get('/:agreementId/download', authenticate, downloadAgreementPdfHandler);
router.post('/:agreementId/terminate', authenticate, validate(terminateAgreementSchema), terminateAgreementHandler);

export default router;
