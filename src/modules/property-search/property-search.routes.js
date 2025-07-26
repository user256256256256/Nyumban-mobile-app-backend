import express from 'express';
import { authenticate } from '../auth/auth.middleware.js'
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import { 
    searchPropertiesHandler,
    rankedPropertyFeedHandler,
} from './property-search.controller.js'

import { validate } from '../../common/middleware/validate.middleware.js';
import {  } from './property-search.validator.js'

const router = express.Router()

router.get('/search', authenticate, authorizeRoles('tenant'), searchPropertiesHandler);
router.get('/feed', authenticate, authorizeRoles('tenant'), rankedPropertyFeedHandler);


export default router;