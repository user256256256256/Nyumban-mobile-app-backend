import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
    getLeaseAgreementHandler,
    getTenantAgreementsHandler,
    cancelAgreementHandler
} from './agreement-management-tenant.controller.js';

import { validate } from '../../common/middleware/validate.middleware.js';
import { getLeaseAgreementSchema, cancelAgreementSchema } from './agreement-management-tenant.validator.js';

const router = express.Router();

router.get('/tenants-agreements', authenticate, authorizeRoles('tenant'), getTenantAgreementsHandler);
router.get('/properties/:propertyId', authenticate, authorizeRoles('tenant'), validate(getLeaseAgreementSchema), getLeaseAgreementHandler);
router.patch('/:agreementId/cancel', authenticate, authorizeRoles('tenant'), validate(cancelAgreementSchema), cancelAgreementHandler);

export default router;
