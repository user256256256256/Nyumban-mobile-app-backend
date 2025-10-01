import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';

import { registerTenantManuallyHandler } from './register-tenants-manually.controller.js';
import { registerTenantManuallySchema } from './register-tenants-manually.validator.js';

const router = express.Router();

router.post('/agreements/:agreementId/tenants/:tenantId/manual-register', authenticate, authorizeRoles('landlord'), validate(registerTenantManuallySchema), registerTenantManuallyHandler );

export default router;
