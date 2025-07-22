import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';

import {
    getTenantsHandler, 
    getTenantRentHistoryHandler, 
} from './tenant-management.controller.js'

import { validate } from '../../common/middleware/validate.js';
import {  } from './tenant-management.validator.js';

const router = express.Router();

router.get('/tenants', authenticate, getTenantsHandler)
router.get('/tenants/:tenantId/payment-history', authenticate, getTenantRentHistoryHandler)

export default router;
