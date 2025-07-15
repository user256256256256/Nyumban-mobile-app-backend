import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';

import {
  getTenantProfileHandler,
  updateTenantProfileHandler
} from './tenant-profile.controller.js';

import { validate } from '../../common/middleware/validate.js';
import { updateTenantProfileSchema } from './tenant-profile.validator.js';

const router = express.Router();

router.get('/tenant', authenticate, getTenantProfileHandler);
router.put('/update', authenticate, validate(updateTenantProfileSchema), updateTenantProfileHandler);

export default router;
