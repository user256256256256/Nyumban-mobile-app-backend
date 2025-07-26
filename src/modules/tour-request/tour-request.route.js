import express from 'express';
import { authenticate } from '../auth/auth.middleware.js'
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
    tourRequestHandler,
    getTourRequestsHandler, 
    cancelTourRequestHandler
} from './tour-request.controller.js'

import { validate } from '../../common/middleware/validate.middleware.js';
import { tourRequestSchema, cancelTourSchema } from './tour-request.validator.js'

const router = express.Router();

router.post('/request', authenticate, authorizeRoles('tenant'), validate(tourRequestSchema), tourRequestHandler);
router.post('/cancel', authenticate, authorizeRoles('tenant'), validate(cancelTourSchema), cancelTourRequestHandler);
router.get('/my-requests', authenticate, authorizeRoles('tenant'), getTourRequestsHandler);

export default router;
