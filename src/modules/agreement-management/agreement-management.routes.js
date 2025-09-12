import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
    generateAgreementShareLinkHandler,
    downloadAgreementPdfHandler,
    getAgreementHandler,
    deleteRentalAgreementsBatchHandler,
    cancelRentalAgreementsHandler,
    getLeaseAgreementHandler,
    generateAgreementPreviewHandler,
    checkAgreementExistsHandler,
    recoverDeletedAgreementsBatchHandler,
    permanentlyDeleteAgreementsBatchHandler,
} from './agreement-management.controller.js';

import { validate } from '../../common/middleware/validate.middleware.js';
import { agreementActionSchema, propertyAgreementSchema, batchAgreementSchema,  } from './agreement-management.validator.js';

const router = express.Router();

router.delete('/delete', authenticate, authorizeRoles('tenant', 'landlord'), validate(batchAgreementSchema), deleteRentalAgreementsBatchHandler);
router.patch('/cancel', authenticate, authorizeRoles('tenant', 'landlord'), validate(batchAgreementSchema), cancelRentalAgreementsHandler);
router.get('/properties/:propertyId', authenticate, authorizeRoles('tenant'), validate(propertyAgreementSchema), getLeaseAgreementHandler);
router.get('/:agreementId', authenticate, authorizeRoles('landlord', 'tenant'), validate(agreementActionSchema), getAgreementHandler)
router.post('/:agreementId/share', authenticate, authorizeRoles('landlord', 'tenant'), validate(agreementActionSchema), generateAgreementShareLinkHandler);
router.get('/:agreementId/download', authenticate, authorizeRoles('landlord', 'tenant'), validate(agreementActionSchema), downloadAgreementPdfHandler);
router.get('/:propertyId/agreement/exists', authenticate, authorizeRoles('landlord', 'tenant'), validate(propertyAgreementSchema), checkAgreementExistsHandler);
router.get('/:agreementId/preview', authenticate, authorizeRoles('landlord', 'tenant'), validate(agreementActionSchema),  generateAgreementPreviewHandler);
router.delete('/permanent-delete', authenticate, authorizeRoles('tenant', 'landlord'), validate(batchAgreementSchema), permanentlyDeleteAgreementsBatchHandler );
router.patch('/recover', authenticate, authorizeRoles('tenant', 'landlord'), validate(batchAgreementSchema), recoverDeletedAgreementsBatchHandler);

export default router;

