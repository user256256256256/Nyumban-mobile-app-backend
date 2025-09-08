import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
    getLeaseAgreementHandler,
    getTenantAgreementsHandler,
    cancelAgreementHandler,
    deleteRentalAgreementHandler,
    deleteRentalAgreementsBatchHandler,
    cancelRentalAgreementsHandler,
    acceptAgreementHandler,
} from './agreement-management-tenant.controller.js';

import { validate } from '../../common/middleware/validate.middleware.js';
import { propertyAgreementSchema, cancelAgreementSchema, acceptAgreementSchema } from './agreement-management-tenant.validator.js';

const router = express.Router();

router.get('/tenants-agreements', authenticate, authorizeRoles('tenant'), getTenantAgreementsHandler);
router.get('/properties/:propertyId', authenticate, authorizeRoles('tenant'), validate(propertyAgreementSchema), getLeaseAgreementHandler);
router.patch('/:agreementId/cancel', authenticate, authorizeRoles('tenant'), validate(cancelAgreementSchema), cancelAgreementHandler);
router.delete('/:agreementId/delete', authenticate, authorizeRoles('tenant', 'landlord'), validate(propertyAgreementSchema), deleteRentalAgreementHandler);
router.delete('/delete', authenticate, authorizeRoles('tenant', 'landlord'), deleteRentalAgreementsBatchHandler);
router.patch('/cancel', authenticate, authorizeRoles('tenant'), cancelRentalAgreementsHandler);
router.post('/:agreementId/accept', authenticate, authorizeRoles('tenant', 'landlord'), validate(acceptAgreementSchema), acceptAgreementHandler);
router.post('/:agreementId/accept', authenticate, authorizeRoles('tenant', 'landlord'), validate(acceptAgreementSchema), acceptAgreementHandler);

export default router;
