import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
    getTenantAgreementsHandler,
    acceptAgreementHandler,
} from './agreement-management-tenant.controller.js';

import { validate } from '../../common/middleware/validate.middleware.js';
import { acceptAgreementSchema } from './agreement-management-tenant.validator.js';

const router = express.Router();

router.get('/tenants-agreements', authenticate, authorizeRoles('tenant'), getTenantAgreementsHandler);
router.post('/:agreementId/accept', authenticate, authorizeRoles('tenant'), validate(acceptAgreementSchema), acceptAgreementHandler);

export default router;
