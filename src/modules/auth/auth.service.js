import prisma from '../../prisma-client.js';
import OTPService from './otp.service.js';
import { generateToken } from '../../common/utils/jwt.js';
import { v4 as uuidv4 } from 'uuid';
import { uploadToStorage } from '../../common/services/s3.service.js'

const isEmail = (identifier) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

/**
 * Handle OTP request for login/signup. No user creation here.
 * @param {string} identifier - Email or phone number
 * @returns {Object} - Message and next step
 */
const handleOtpRequest = async (identifier) => {
  await OTPService.sendOtp(identifier);

  return {
    message: 'OTP sent to email or phone number',
    next_step: 'verify_otp',
    identifier: `${identifier}`,
  };
};

/**
 * Verify OTP, create user if new, and return token or prompt for role selection
 * @param {string} identifier - Email or phone number
 * @param {string} otp - One-time password from user
 * @returns {Object} - Auth result, token, and redirection info
 */
const verifyOtp = async (identifier, otp) => {
  const where = isEmail(identifier)
    ? { email: identifier }
    : { phone_number: identifier };

  //  Step 1: Validate OTP
  const isValid = await OTPService.verifyOtp(identifier, otp);
  if (!isValid) {
    return {
      status: 401,
      code: 'AUTH_401_UNAUTHORIZED',
      message: 'Invalid or expired OTP',
      details: { field: 'otp' },
    };
  }

  //  Step 2: Find or create user
  let user = await prisma.users.findUnique({ where });

  if (!user) {
    const data = {
      ...(isEmail(identifier)
        ? { email: identifier, is_email_confirmed: true }
        : { phone_number: identifier, is_phone_number_confirmed: true }),
    };

    user = await prisma.users.create({ data });
  } else {
    await prisma.users.update({
      where: { id: user.id },
      data: isEmail(identifier)
        ? { is_email_confirmed: true }
        : { is_phone_number_confirmed: true },
    });
  }

  //  Step 3: Check for existing role
  const roleAssignment = await prisma.user_role_assignments.findFirst({
    where: { user_id: user.id },
    include: { user_roles: true },
  });

  const assignedRole = roleAssignment?.user_roles?.role || null;

  //  Step 4: Generate JWT
  const token = generateToken({
    id: user.id,
    role: assignedRole,
  });

  //  Step 5: Decide next step
  if (!assignedRole) {
    return {
      message: 'OTP verified. Please choose a role.',
      requires_role_selection: true,
      token,
    };
  }

  return {
    message: 'Authentication successful',
    token,
    redirect_to: `/dashboard/${assignedRole}`,
  };
};

/**
 * Assign role to user and return updated token + redirection info
 * @param {string} userId - ID of the user
 * @param {string} role - Role string (e.g., 'landlord')
 * @returns {Object} - Success message, token, and redirection
 */
const setUserRole = async (userId, role) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const roleRecord = await prisma.user_roles.findFirst({
    where: { role },
  });

  if (!roleRecord) {
    throw new Error('Invalid role specified');
  }

  const roleAssignment = await prisma.user_role_assignments.create({
    data: {
      id: uuidv4(),
      user_id: userId,
      role_id: roleRecord.id,
    },
    include: {
      user_roles: true,
    },
  });

  const token = generateToken({
    id: userId,
    role: roleAssignment.user_roles.role,
  });

  return {
    message: 'Role saved successfully',
    redirect_to: `/dashboard/${role}`,
    token,
  };
};


/**
 * Completes the user profile with name and optional profile image.
 * @param {string} userId
 * @param {string} userName
 * @param {Object} profileFile - Multer file object (optional)
 * @returns {Object} - Confirmation and redirection path
 */

const completeProfile = async (userId, userName, profileFile) => {
  let profilePicUrl = null;

  if (profileFile) {
    profilePicUrl = await uploadToStorage(profileFile.buffer, profileFile.originalName);
  }

  await prisma.users.update({
    where: { id: userId },
    data: {
      username: userName, 
      profile_picture_path: profilePicUrl,
      is_profile_complete: true,
    }
  });

  return {
    message: 'Profile completed successfully',
    redirect_to: '/dashboard'
  }
}

const getSlidesByRole = async (role) => {
  const roleRecord = await prisma.user_roles.findFirst({
    where: {role},
  })

  if (!roleRecord) return [];

  return await prisma.slides.findMany({
    where: {
      is_active: true,
      is_deleted: false,
      slide_role_assignments: {
        some: { role_id: roleRecord.id },
      },
    },
    orderBy: { created_at: 'asc'},
  });
}

const hasCompletedOnboarding = async (userId) => {
  const user = await prisma.users.findUnique({
    where: { id: userId},
    select: { is_onboarding_complete: true },
  });
  return user?.is_onboarding_complete === true;
}

const completeOnboarding = async (userId) => {

  const user = await prisma.users.update({
    where: { id: userId },
    data: { is_onboarding_complete: true },
    include: {
      user_role_assignments: {
        include: {user_roles: true},
      },
    },
  });

  const role = user.user_role_assignments?.[0]?.user_roles?.role || 'tenant';
  return role;
}

export default {
  handleOtpRequest,
  verifyOtp,
  setUserRole,
  completeProfile,
  getSlidesByRole,
  hasCompletedOnboarding,
  completeOnboarding,
};
