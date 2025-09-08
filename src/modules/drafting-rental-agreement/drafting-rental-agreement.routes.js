import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import { 
    checkAgreementExistsHandler,
    createOrUpdateDraftHandler,
    generateAgreementPreviewHandler,
    finalizeAgreementHandler
} from './drafting-rental-agreement.controller.js'

import { validate } from '../../common/middleware/validate.middleware.js';
import { draftAgreementSchema, finalizeAgreementSchema, propertyIdParamSchema, agreementIdParamSchema } from './drafting-rental-agreement.validator.js'
const router = express.Router()

router.get('/:propertyId/agreement/exists', authenticate, authorizeRoles('landlord'), validate(propertyIdParamSchema), checkAgreementExistsHandler);
router.get('/:agreementId/preview', authenticate, authorizeRoles('landlord'), validate(agreementIdParamSchema),  generateAgreementPreviewHandler);
router.post('/:propertyId/agreement/create', authenticate, authorizeRoles('landlord'), validate(draftAgreementSchema), createOrUpdateDraftHandler);
router.patch('/:propertyId/agreement/finalize', authenticate, authorizeRoles('landlord'), validate(finalizeAgreementSchema), finalizeAgreementHandler);

export default router;