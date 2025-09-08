import express from 'express'
import { authenticate } from '../../common/middleware/auth.middleware.js'; 
import { sendSupportMessageHandler } from './support.controller.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { supportMessageSchema } from './support.validator.js'

const router = express.Router();

router.post('/message', authenticate, validate(supportMessageSchema), sendSupportMessageHandler)

export default router;