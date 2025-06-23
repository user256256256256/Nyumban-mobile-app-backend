import express from 'express'

import {
    requestOtpHandler,
    verifyOtpHandler,
    submitRoleHandler
} from './auth.controller.js'

import { validate } from '../../common/middleware/validate.js'
import { requestOtpSchema, verifyOtpSchema, submitRoleSchema } from './auth.validator.js'

const router = express.Router();

router.post('/request-otp', validate(requestOtpSchema), requestOtpHandler);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtpHandler);
router.post('/submit-role', validate(submitRoleSchema), submitRoleHandler);

export default router; 