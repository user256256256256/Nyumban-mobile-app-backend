import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
    getAllLandlordAgreementsHandler,
    generateAgreementShareLinkHandler,
    downloadAgreementPdfHandler,
    terminateAgreementHandler
} from './agreement-management-landlord.controller.js';

import { validate } from '../../common/middleware/validate.middleware.js';
import { shareAgreementSchema, terminateAgreementSchema, downloadAgreementSchema } from './agreement-management-landlord.validator.js';

const router = express.Router();

router.get('/agreements', authenticate, authorizeRoles('landlord'), getAllLandlordAgreementsHandler);

router.post('/:agreementId/share', authenticate, authorizeRoles('landlord'), validate(shareAgreementSchema), generateAgreementShareLinkHandler);

router.get('/:agreementId/download', authenticate, authorizeRoles('landlord'), validate(downloadAgreementSchema), downloadAgreementPdfHandler);

router.post('/:agreementId/terminate', authenticate, authorizeRoles('landlord'), validate(terminateAgreementSchema), terminateAgreementHandler);

export default router;
