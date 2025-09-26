import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
    tourRequestHandler,
    getTourRequestsHandler, 
    cancelTourRequestsHandler,
    deleteTourRequestsHandler,
} from './tour-request.controller.js'

import { validate } from '../../common/middleware/validate.middleware.js';
import { tourRequestSchema, cancelTourBatchSchema, deleteTourBatchSchema } from './tour-request.validator.js'

const router = express.Router();

router.post('/request', authenticate, authorizeRoles('tenant'), validate(tourRequestSchema), tourRequestHandler);
router.post('/cancel', authenticate, authorizeRoles('tenant'), validate(cancelTourBatchSchema), cancelTourRequestsHandler);
router.delete('/delete', authenticate, authorizeRoles('tenant'), validate(deleteTourBatchSchema), deleteTourRequestsHandler);
router.get('/my-requests', authenticate, authorizeRoles('tenant'), getTourRequestsHandler);

export default router;
