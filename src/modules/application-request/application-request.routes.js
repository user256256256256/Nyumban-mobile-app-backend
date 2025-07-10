import express from 'express';
import { authenticate } from '../auth/auth.middleware.js'

import {
    applicationRequestHandler,
    getApplicationsRequestHandler,
    cancelApplicationRequestHanlder
} from './application-request.controller.js'

import { validate } from '../../common/middleware/validate.js';
import { applicationRequestSchema, cancelApplicationSchema} from './application-request.validator.js'

const router = express.Router();

router.post('/request', authenticate, validate(applicationRequestSchema), applicationRequestHandler)
router.post('/cancel', authenticate, validate(cancelApplicationSchema), cancelApplicationRequestHanlder)
router.get('/my-requests', authenticate, getApplicationsRequestHandler)

export default router;
