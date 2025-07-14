import express from 'express';
import { authenticate } from '../auth/auth.middleware.js'

import { 
    searchPropertiesHandler,
    rankedPropertyFeedHandler,
} from './property-search.controller.js'

import { validate } from '../../common/middleware/validate.js';
import {  } from './property-search.validator.js'

const router = express.Router()

router.get('/search', authenticate, searchPropertiesHandler)
router.get('/feed', authenticate, rankedPropertyFeedHandler);

export default router;