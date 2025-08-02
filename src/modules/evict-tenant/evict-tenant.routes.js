import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';
import {
  initiateEvictionHandler,
  finalizeEvictionHandler,
} from './evict-tenant.controller.js';

import { evictTenantSchema, finalizeEvictionSchema } from './evict-tenant.validator.js';

const router = express.Router();

router.post('/tenants/:tenantId/evict', authenticate, authorizeRoles('landlord'), validate(evictTenantSchema), initiateEvictionHandler);
router.post( '/evictions/:evictionLogId/finalize', authenticate, authorizeRoles('landlord'), validate(finalizeEvictionSchema),  finalizeEvictionHandler);

export default router;
