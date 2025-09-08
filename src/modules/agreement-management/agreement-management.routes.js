import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
    generateAgreementShareLinkHandler,
    downloadAgreementPdfHandler,
    getAgreementHandler,
} from './agreement-management.controller.js';

import { validate } from '../../common/middleware/validate.middleware.js';
import { AgreementActionSchema } from './agreement-management.validator.js';

const router = express.Router();

router.get('/:agreementId', authenticate, authorizeRoles('landlord', 'tenant'), validate(AgreementActionSchema), getAgreementHandler)
router.post('/:agreementId/share', authenticate, authorizeRoles('landlord', 'tenant'), validate(AgreementActionSchema), generateAgreementShareLinkHandler);
router.get('/:agreementId/download', authenticate, authorizeRoles('landlord', 'tenant'), validate(AgreementActionSchema), downloadAgreementPdfHandler);

export default router;

