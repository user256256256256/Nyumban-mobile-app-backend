import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
  getTenantProfileHandler,
  updateTenantProfileHandler
} from './tenant-profile.controller.js';

import { validate } from '../../common/middleware/validate.middleware.js';
import { updateTenantProfileSchema } from './tenant-profile.validator.js';

const router = express.Router();

router.get('/tenant', authenticate, authorizeRoles('tenant'), getTenantProfileHandler);
router.put('/update', authenticate, authorizeRoles('tenant'), validate(updateTenantProfileSchema), updateTenantProfileHandler);

export default router;
