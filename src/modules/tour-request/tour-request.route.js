import express from 'express';
import { authenticate } from '../auth/auth.middleware.js'

import {

} from './tour-request.controller.js'

import { validate } from '../../common/middleware/validate.js';
import {  } from './tour-request.validator.js'

const router = express.Router();

export default router;