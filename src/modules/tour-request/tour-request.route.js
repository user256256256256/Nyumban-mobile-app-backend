import express from 'express';
import { authenticate } from '../auth/auth.middleware.js'

import {
    tourRequestHandler,
    getTourRequestsHandler, 
    cancelTourRequestHandler
} from './tour-request.controller.js'

import { validate } from '../../common/middleware/validate.js';
import { tourRequestSchema, cancelTourSchema } from './tour-request.validator.js'

const router = express.Router();

router.post('/request', authenticate, validate(tourRequestSchema), tourRequestHandler)
router.post('/cancel', authenticate, validate(cancelTourSchema), cancelTourRequestHandler)
router.get('/my-requests', authenticate, getTourRequestsHandler)
export default router;
