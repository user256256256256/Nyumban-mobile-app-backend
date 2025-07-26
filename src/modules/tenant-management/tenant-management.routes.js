import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
    getTenantsHandler, 
    getTenantRentHistoryHandler, 
} from './tenant-management.controller.js'

import { validate } from '../../common/middleware/validate.middleware.js';
import { tenantIdParamSchema } from './tenant-management.validator.js';

const router = express.Router();

router.get('/tenants', authenticate, authorizeRoles('landlord'), getTenantsHandler);
router.get('/tenants/:tenantId/payment-history', authenticate, authorizeRoles('landlord'), validate(tenantIdParamSchema), getTenantRentHistoryHandler);

export default router;
