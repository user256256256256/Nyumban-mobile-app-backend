import express from 'express';
import { authenticate } from './auth.middleware.js'; 
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
  getUserRolesHandler,
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
router.post('/complete/onboarding', authorizeRoles('tenant', 'landlord'), authenticate, completeOnboardingHandler);

// Role Handling & Switching
router.get('/roles', authenticate, getRolesHandler);
router.post('/roles/switch', authenticate, authorizeRoles('tenant', 'landlord'), validate({ body: switchRoleSchema }), switchRoleHandler)
router.post('/roles/add', authenticate, authorizeRoles('tenant', 'landlord'), validate({ body: addRoleSchema }), addRoleHandler)
router.get('/roles/user', authenticate, authorizeRoles('tenant', 'landlord'), getUserRolesHandler);
router.get('/role/active', authenticate, authorizeRoles('tenant', 'landlord'), getActiveUserRoleHandler);

export default router;

