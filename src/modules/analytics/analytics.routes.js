import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
    getPropertyAnalyticsHandler,
} from './analytics.controller.js'

const router = express.Router();

router.post('/properties/analytics', authenticate, authorizeRoles('landlord', 'tenant'), getPropertyAnalyticsHandler);

export default router;
