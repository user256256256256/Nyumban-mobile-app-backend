import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';

import {
  getLandlordProfileHandler,
  updateLandlordProfileHandler
} from './landlord-profile.controller.js';

import { validate } from '../../common/middleware/validate.js';
import { updateLandlordProfileSchema } from './landlord-profile.validator.js';

const router = express.Router();

router.get('/landlord', authenticate, getLandlordProfileHandler);
router.put('/update', authenticate, validate(updateLandlordProfileSchema), updateLandlordProfileHandler);

export default router;
