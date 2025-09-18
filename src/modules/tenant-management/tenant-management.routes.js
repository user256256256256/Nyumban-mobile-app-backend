import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
    getTenantsHandler, 
    getTenantRentHistoryHandler, 
    sendRentRemindersHandler,
} from './tenant-management.controller.js'

import { validate } from '../../common/middleware/validate.middleware.js';
import { tenantIdParamSchema, remindTenantRentSchema } from './tenant-management.validator.js';

const router = express.Router();

router.get('/tenants', authenticate, authorizeRoles('landlord'), getTenantsHandler);
router.get('/tenants/:tenantId/rent-history', authenticate, authorizeRoles('landlord'), validate(tenantIdParamSchema), getTenantRentHistoryHandler);
router.post('/tenants/remind-rent', authenticate, authorizeRoles('landlord'), validate(remindTenantRentSchema), sendRentRemindersHandler );  
export default router;
