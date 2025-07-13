import express from 'express';
import { authenticate } from '../auth/auth.middleware.js'

import {
    getLandlordApplicationRequestsHandler,
    resolveApplicationRequestHandler,
} from './application-request-resolution.controller.js'

import { validate } from '../../common/middleware/validate.js';
import { resolveApplicationRequestSchema } from './application-request-resolution.validator.js'

const router = express.Router();

router.get('/landlord/application-requests', authenticate, getLandlordApplicationRequestsHandler);
router.patch('/landlord/application-requests/:applicationId/resolve', authenticate, validate(resolveApplicationRequestSchema), resolveApplicationRequestHandler)

export default router;
