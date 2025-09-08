import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js'; 
import { uploadImage } from '../../common/middleware/upload.middleware.js'
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';

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
  getActiveUserRoleHandler
} from './auth.controller.js';

import { validate } from '../../common/middleware/validate.middleware.js';
import { requestOtpSchema, verifyOtpSchema, submitRoleSchema, completeProfileSchema, switchRoleSchema, addRoleSchema } from './auth.validator.js';

const router = express.Router();

// Sign-up
router.post('/request-otp', validate(requestOtpSchema), requestOtpHandler);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtpHandler);
router.post('/submit-role', authenticate, validate(submitRoleSchema), submitRoleHandler);

// Profile Completion
router.get('/profile/status', authenticate, authorizeRoles('tenant', 'landlord'), checkProfileStatusHandler);
router.post('/profile/complete', authenticate, authorizeRoles('tenant', 'landlord'), uploadImage.single('profile_picture'), validate({ body: completeProfileSchema }), completeProfileHandler);

// Onboarding 
router.get('/slides', authenticate, authorizeRoles('tenant', 'landlord'), getSliderHandler);
router.post('/complete', authenticate, authorizeRoles('tenant', 'landlord'), completeOnboardingHandler);

// Role Handling & Switching
router.get('/user-roles', authenticate, authorizeRoles('tenant', 'landlord'), getRolesHandler);
router.post('/switch-role', authenticate, authorizeRoles('tenant', 'landlord'), validate({ body: switchRoleSchema }), switchRoleHandler)
router.post('/add-role', authenticate, authorizeRoles('tenant', 'landlord'), validate({ body: addRoleSchema }), addRoleHandler)
router.get('/active-role', authenticate, authorizeRoles('tenant', 'landlord'), getActiveUserRoleHandler);

export default router;

