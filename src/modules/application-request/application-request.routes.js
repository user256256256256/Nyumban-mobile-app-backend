import express from 'express';
import { authenticate } from '../auth/auth.middleware.js'
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
    applicationRequestHandler,
    getApplicationsRequestHandler,
    cancelApplicationRequestHanlder
} from './application-request.controller.js'

import { validate } from '../../common/middleware/validate.middleware.js';
import { applicationRequestSchema, cancelApplicationSchema} from './application-request.validator.js'

const router = express.Router();

router.post('/request', authenticate, authorizeRoles('tenant'), validate(applicationRequestSchema), applicationRequestHandler);
router.post('/cancel', authenticate, authorizeRoles('tenant'), validate(cancelApplicationSchema), cancelApplicationRequestHanlder);
router.get('/my-requests', authenticate, authorizeRoles('tenant'), getApplicationsRequestHandler);

export default router;
