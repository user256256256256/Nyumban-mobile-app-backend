import express from 'express';
import multer from 'multer';
import { authenticate } from './auth.middleware.js'; 

import {
  requestOtpHandler,
  verifyOtpHandler,
  submitRoleHandler,
  checkProfileStatusHandler,
  completeProfileHandler,
  getSliderHandler,
  completeOnboardingHandler
} from './auth.controller.js';

import { validate } from '../../common/middleware/validate.js';
import { requestOtpSchema, verifyOtpSchema, submitRoleSchema, completeProfileSchema } from './auth.validator.js';

const router = express.Router();
const upload = multer();

// Sign-up
router.post('/request-otp', validate(requestOtpSchema), requestOtpHandler);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtpHandler);
router.post('/submit-role', authenticate, validate(submitRoleSchema), submitRoleHandler);

// Profile Completion
router.get('/profile/status', authenticate, checkProfileStatusHandler);
router.post('/profile/complete', authenticate, upload.single('profile_picture'), validate(completeProfileSchema), completeProfileHandler);

// Onboarding 
router.get('/slides', authenticate, getSliderHandler);
router.post('/complete/onboarding', authenticate, completeOnboardingHandler);

export default router;

