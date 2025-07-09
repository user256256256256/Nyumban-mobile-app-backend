import express from 'express';
import { authenticate } from '../auth/auth.middleware.js'

import {
    getLandlordTourRequestsHandler,
    resolveTourRequestHandler,
} from './tour-request-resolution.controller.js'

import { validate } from '../../common/middleware/validate.js';
import { resolveTourRequestSchema } from './tour-request-resolution.validator.js'

const router = express.Router();

router.get('/landlord/tour-requests', authenticate, getLandlordTourRequestsHandler)
router.patch('/landlord/tour-requests/:requestId/resolve', authenticate, validate(resolveTourRequestSchema), resolveTourRequestHandler)

export default router;
