import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { 
    submitReviewHandler 
} from './reviews-and-feedback.controller.js';
import { validate } from '../../common/middleware/validate.js';
import { reviewSchema } from './reviews-and-feedback.validator.js';

const router = express.Router();

router.post('/submit', authenticate, validate(reviewSchema), submitReviewHandler);

export default router;
