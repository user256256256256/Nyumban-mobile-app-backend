import express from 'express';
import { authenticate } from '../auth/auth.middleware.js'

import { 
    checkAgreementExistsHandler,
    createOrUpdateDraftHandler,
    generateAgreementPreviewHandler,
    finalizeAgreementHandler
} from './drafting-rental-agreement.controller.js'

import { validate } from '../../common/middleware/validate.js';
import { draftAgreementSchema, finalizeAgreementSchema } from './drafting-rental-agreement.validator.js'

const router = express.Router()

router.get('/:propertyId/agreement/exists', authenticate, checkAgreementExistsHandler)
router.get('/:agreementId/preview', authenticate, generateAgreementPreviewHandler)
router.post('/:propertyId/agreement/create', authenticate, validate(draftAgreementSchema), createOrUpdateDraftHandler)
router.patch('/:propertyId/agreement/finalize', authenticate, validate(finalizeAgreementSchema), finalizeAgreementHandler)
export default router;