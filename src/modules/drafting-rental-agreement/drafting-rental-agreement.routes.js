import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import { 
    createOrUpdateDraftHandler,
    finalizeAgreementHandler
} from './drafting-rental-agreement.controller.js'

import { validate } from '../../common/middleware/validate.middleware.js';
import { draftAgreementSchema, finalizeAgreementSchema } from './drafting-rental-agreement.validator.js'
const router = express.Router()


router.post('/:propertyId/agreement/create', authenticate, authorizeRoles('landlord'), validate(draftAgreementSchema), createOrUpdateDraftHandler);
router.patch('/:propertyId/agreement/finalize', authenticate, authorizeRoles('landlord'), validate(finalizeAgreementSchema), finalizeAgreementHandler);

export default router;