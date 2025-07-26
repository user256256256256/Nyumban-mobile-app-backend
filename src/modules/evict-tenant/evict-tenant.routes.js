import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import { evictTenantSchema } from './evict-tenant.validator.js';
import {
  evictTenantHandler,
} from './evict-tenant.controller.js';

const router = express.Router();


router.post('/tenants/:tenantId/evict', authenticate, authorizeRoles('landlord'), validate(evictTenantSchema), evictTenantHandler);

export default router;
