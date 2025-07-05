import express from 'express';
import { authenticate } from './auth.middleware.js'; 
import { uploadImage } from '../../common/middleware/upload.middleware.js'

import {
  requestOtpHandler,
  verifyOtpHandler,
  submitRoleHandler,
  checkProfileStatusHandler,
  completeProfileHandler,
  getSliderHandler,
  completeOnboardingHandler,
  getRolesHandler,
  switchRoleHandler,
  addRoleHandler,
} from './auth.controller.js';

import { validate } from '../../common/middleware/validate.js';
import { requestOtpSchema, verifyOtpSchema, submitRoleSchema, completeProfileSchema, switchRoleSchema, addRoleSchema } from './auth.validator.js';

const router = express.Router();

// Sign-up
router.post('/request-otp', validate(requestOtpSchema), requestOtpHandler);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtpHandler);
router.post('/submit-role', authenticate, validate(submitRoleSchema), submitRoleHandler);

// Profile Completion
router.get('/profile/status', authenticate, checkProfileStatusHandler);
router.post('/profile/complete', authenticate, uploadImage.single('profile_picture'), validate(completeProfileSchema), completeProfileHandler);

// Onboarding 
router.get('/slides', authenticate, getSliderHandler);
router.post('/complete/onboarding', authenticate, completeOnboardingHandler);

// Role Handling & Switching
router.get('/roles', authenticate, getRolesHandler);
router.post('/roles/switch', authenticate, validate(switchRoleSchema), switchRoleHandler)
router.post('/roles/add', authenticate, validate(addRoleSchema), addRoleHandler)

export default router;

