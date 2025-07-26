import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
  getLandlordProfileHandler,
  updateLandlordProfileHandler
} from './landlord-profile.controller.js';

import { validate } from '../../common/middleware/validate.middleware.js';
import { updateLandlordProfileSchema } from './landlord-profile.validator.js';

const router = express.Router();

router.get('/landlord', authenticate, authorizeRoles('landlord'), getLandlordProfileHandler);
router.put('/update', authenticate, authorizeRoles('landlord'), validate(updateLandlordProfileSchema), updateLandlordProfileHandler);

export default router;
