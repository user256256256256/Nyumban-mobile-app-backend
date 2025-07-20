import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';

import {
    getLeaseAgreementHandler,
    getTenantAgreementsHandler,
    cancelAgreementHandler
} from './agreement-management-tenant.controller.js';

import { validate } from '../../common/middleware/validate.js';
import {  } from './agreement-management-tenant.validator.js';

const router = express.Router();

router.get('/tenants-agreements', authenticate, getTenantAgreementsHandler)
router.get('/properties/:propertyId', authenticate, getLeaseAgreementHandler);
router.patch('/:agreementId/cancel', authenticate, cancelAgreementHandler)

export default router;
