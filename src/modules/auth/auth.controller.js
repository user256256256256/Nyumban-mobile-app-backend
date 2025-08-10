import { success } from '../../common/utils/response-builder.util.js';
import AuthService from './auth.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

// Request OTP
export const requestOtpHandler = async (req, res) => {
  try {
    const { identifier } = req.body;
    const result = await AuthService.handleOtpRequest(identifier);
    return success(res, result, 'OTP sent successfully');
  } catch (err) {
    return handleControllerError(res, err, 'OTP_REQUEST_FAILED', 'Failed to send OTP');
  }
};

// Verify OTP
export const verifyOtpHandler = async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    const result = await AuthService.verifyOtp(identifier, otp);

    return success(res, result, 'OTP verified successfully');
  } catch (err) {
    return handleControllerError(res, err, 'OTP_VERIFICATION_FAILED', 'Failed to verify OTP');
  }
};

// Submit Role
export const submitRoleHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { role } = req.body;

    if (!userId) {
      return handleControllerError(res, {
        code: 'UNAUTHORIZED',
        message: 'Missing user ID from token',
        status: 401
      }, 'UNAUTHORIZED', 'Unauthorized access', 401);
    }

    const result = await AuthService.setUserRole(userId, role);
    return success(res, result, 'Role submitted successfully');
  } catch (err) {
    return handleControllerError(res, err, 'SUBMIT_ROLE_FAILED', 'Failed to submit role');
  }
};

// Check Profile Status
export const checkProfileStatusHandler = async (req, res) => {
  try {
    const result = await AuthService.checkProfileStatus(req.user.id);
    return success(res, result, 'Profile status fetched');
  } catch (err) {
    return handleControllerError(res, err, 'SERVER_ERROR', 'Failed to fetch profile status');
  }
};

// Complete Profile
export const completeProfileHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { user_name } = req.body;

    if (!user_name) {
      return handleControllerError(res, {
        code: 'FORM_400_VALIDATION_FAILED',
        message: 'Name is required',
        status: 400,
        details: { field: 'user_name' }
      }, 'FORM_400_VALIDATION_FAILED', 'Name is required', 400);
    }

    const result = await AuthService.completeProfile(userId, user_name, req.file);
    return success(res, result, 'Profile completed successfully');
  } catch (err) {
    return handleControllerError(res, err, 'FORM_400_VALIDATION_FAILED', 'Failed to complete profile', 400);
  }
};

// Get Onboarding Slides
export const getSliderHandler = async (req, res) => {
  try {
    const slides = await AuthService.getSlidesByRole(req.user.role);
    return success(res, { slides }, 'Slides fetched successfully');
  } catch (err) {
    return handleControllerError(res, err, 'SERVER_ERROR', 'Failed to retrieve onboarding slides');
  }
};

// Complete Onboarding
export const completeOnboardingHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const alreadyCompleted = await AuthService.hasCompletedOnboarding(userId);

    if (alreadyCompleted) {
      return handleControllerError(res, {
        code: 'FORM_400_VALIDATION_FAILED',
        message: 'Onboarding already marked as complete',
        status: 400,
        details: { field: 'user_state' }
      }, 'FORM_400_VALIDATION_FAILED', 'Onboarding already marked as complete', 400);
    }

    const role = await AuthService.completeOnboarding(userId);

    return success(res, {
      redirect_to: `/dashboard/${role}`
    }, 'Onboarding completed successfully');

  } catch (err) {
    return handleControllerError(res, err, 'SERVER_ERROR', 'Failed to complete onboarding');
  }
};

// Get Linked Roles
export const getRolesHandler = async (req, res) => {
  try {
    const data = await AuthService.getLinkedRoles(req.user.id);
    return success(res, data, 'Roles fetched successfully');
  } catch (err) {
    return handleControllerError(res, err, 'SERVER_ERROR', 'Failed to get roles');
  }
};

// Switch Active Role
export const switchRoleHandler = async (req, res) => {
  try {
    const result = await AuthService.switchRole(req.user.id, req.body.target_role);
    return success(res, result, 'Role switched successfully');
  } catch (err) {
    return handleControllerError(res, err, 'SERVER_ERROR', 'Failed to switch roles');
  }
};

// Add New Role
export const addRoleHandler = async (req, res) => {
  try {
    const result = await AuthService.addRole(req.user.id, req.body.new_role);
    return success(res, result, 'Role added successfully');
  } catch (err) {
    return handleControllerError(res, err, 'SERVER_ERROR', 'Failed to add role');
  }
};

export const getActiveUserRoleHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    const result = await AuthService.getActiveUserRole(userId);
    return success(res, result, 'Active user role fetched successfully');
  } catch (err) {
    return handleControllerError(res, err, 'FETCH_ACTIVE_ROLE_FAILED', 'Failed to fetch active role');
  }
};
