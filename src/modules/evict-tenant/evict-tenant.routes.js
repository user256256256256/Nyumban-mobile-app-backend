import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { validate } from '../../common/middleware/validate.js';
import { evictTenantSchema } from './evict-tenant.validator.js';
import {
  evictTenantHandler,
} from './evict-tenant.controller.js';

const router = express.Router();

router.post( '/tenants/:tenantId/evict', authenticate, validate(evictTenantSchema), evictTenantHandler);

export default router;
