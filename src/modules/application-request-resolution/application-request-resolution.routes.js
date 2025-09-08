import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';


import {
    getLandlordApplicationRequestsHandler,
    resolveApplicationRequestHandler,
    deleteApplicationRequestsHandler,
    orchestrateApplicationResolutionHandler
} from './application-request-resolution.controller.js'

import { validate } from '../../common/middleware/validate.middleware.js';
import { resolveApplicationRequestSchema, deleteApplicationRequestsSchema } from './application-request-resolution.validator.js'

const router = express.Router();

router.get('/landlord/application-requests', authenticate, authorizeRoles('landlord'), getLandlordApplicationRequestsHandler);
router.patch('/:applicationId/resolve', authenticate, authorizeRoles('landlord'), validate(resolveApplicationRequestSchema), resolveApplicationRequestHandler);
router.delete('/landlord/application-requests', authenticate, authorizeRoles('landlord'), validate(deleteApplicationRequestsSchema), deleteApplicationRequestsHandler ) 
router.patch('/:applicationId/orchestrate-resolve', authenticate, authorizeRoles('landlord'), validate(resolveApplicationRequestSchema), orchestrateApplicationResolutionHandler );

export default router;
