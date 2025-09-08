import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

import { 
    submitReviewHandler 
} from './reviews-and-feedback.controller.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { reviewSchema } from './reviews-and-feedback.validator.js';

const router = express.Router();

router.post('/submit', authenticate, authorizeRoles('tenant', 'landlord'), validate(reviewSchema), submitReviewHandler);

export default router;
