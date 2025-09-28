import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import {
    applicationRequestHandler,
    getApplicationsRequestHandler,
    cancelApplicationBatchRequestHandler,
    deleteApplicationBatchRequestHandler,
} from './application-request.controller.js'

import { validate } from '../../common/middleware/validate.middleware.js';
import { applicationRequestSchema, cancelApplicationBatchSchema, deleteApplicationBatchSchema} from './application-request.validator.js'

const router = express.Router();

router.post('/request', authenticate, authorizeRoles('tenant'), validate(applicationRequestSchema), applicationRequestHandler);
router.get('/my-requests', authenticate, authorizeRoles('tenant'), getApplicationsRequestHandler);
router.post('/cancel', authenticate, authorizeRoles('tenant'), validate(cancelApplicationBatchSchema), cancelApplicationBatchRequestHandler);
router.delete('/delete', authenticate, authorizeRoles('tenant'), validate(deleteApplicationBatchSchema), deleteApplicationBatchRequestHandler);


export default router;
