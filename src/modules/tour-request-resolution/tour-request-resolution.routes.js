import express from 'express';
import { authenticate } from '../auth/auth.middleware.js'
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
    getLandlordTourRequestsHandler,
    resolveTourRequestHandler,
    deleteTourRequestsHandler,
} from './tour-request-resolution.controller.js'

import { validate } from '../../common/middleware/validate.middleware.js';
import { resolveTourRequestSchema, deleteTourRequestsSchema } from './tour-request-resolution.validator.js'

const router = express.Router();

router.get('/landlord/tour-requests', authenticate, authorizeRoles('landlord'), getLandlordTourRequestsHandler);
router.patch('/tour-requests/:requestId/resolve', authenticate, authorizeRoles('landlord'), validate(resolveTourRequestSchema), resolveTourRequestHandler);
router.delete('/landlord/tour-requests', authenticate, authorizeRoles('landlord'), validate(deleteTourRequestsSchema), deleteTourRequestsHandler );
export default router;
