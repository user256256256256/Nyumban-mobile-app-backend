import prisma from '../../prisma-client.js';
import OTPService from './otp.service.js';
import { generateToken } from '../../common/utils/jwt.js';
import { v4 as uuidv4 } from 'uuid';
import { uploadToStorage } from '../../common/services/s3.service.js';
import { isEmail } from '../../common/utils/checkUserIdentifier.js'
import {
  ValidationError,
  NotFoundError,
  AuthError,
  ForbiddenError,
  ServerError,
} from '../../common/services/errors.js';

export const handleOtpRequest = async (identifier) => {
  await OTPService.sendOtp(identifier);
  return {
    message: 'OTP sent to email or phone number',
    next_step: 'verify_otp',
    identifier,
  };
};

export const verifyOtp = async (identifier, otp) => {
  const where = isEmail(identifier)
    ? { email: identifier }
    : { phone_number: identifier };

  // Step 1: Validate OTP
  const isValid = await OTPService.verifyOtp(identifier, otp);
  if (!isValid) throw new AuthError('Invalid or expired OTP', { field: 'otp' });

  // Step 2: Find or create user
  let user = await prisma.users.findUnique({ where });
  if (!user) {
    const data = isEmail(identifier)
      ? { email: identifier, is_email_confirmed: true }
      : { phone_number: identifier, is_phone_number_confirmed: true };

    user = await prisma.users.create({ data });
  } else {
    await prisma.users.update({
      where: { id: user.id },
      data: isEmail(identifier)
        ? { is_email_confirmed: true, updated_at: new Date() }
        : { is_phone_number_confirmed: true, updated_at: new Date() },
    });    
  }

  // Step 3: Find role assignment
  const roleAssignment = await prisma.user_role_assignments.findFirst({
    where: { user_id: user.id },
    include: { user_roles: true },
  });

  const assignedRole = roleAssignment?.user_roles?.role || null;

  // Step 4: Generate JWT token
  const token = generateToken({ id: user.id, role: assignedRole });

  // Step 5: Return response based on role
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

export const setUserRole = async (userId, roleInput) => {
  if (!userId) throw new ValidationError('User ID is required');

  const roles = Array.isArray(roleInput) ? roleInput : [roleInput];

  const roleRecords = await prisma.user_roles.findMany({
    where: { role: { in: roles } },
  });

  if (roleRecords.length !== roles.length) {
    throw new ValidationError('Invalid role(s) specified');
  }

  const createAssignments = roleRecords.map((role) =>
    prisma.user_role_assignments.create({
      data: { id: uuidv4(), user_id: userId, role_id: role.id },
    })
  );

  const updateUserActiveRole = prisma.users.update({
    where: { id: userId },
    data: { active_role: roles[0], updated_at: new Date(), },
  });

  await prisma.$transaction([...createAssignments, updateUserActiveRole]);

  const token = generateToken({ id: userId, role: roles[0] });

  return {
    message: 'Role(s) saved successfully',
    redirect_to: `/dashboard/${roles[0]}`,
    token,
  };
};

export const completeProfile = async (userId, userName, profileFile) => {
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
      updated_at: new Date(),
    },
  });

  return {
    message: 'Profile completed successfully',
    redirect_to: '/dashboard',
  };
};

export const getSlidesByRole = async (role) => {
  const roleRecord = await prisma.user_roles.findFirst({ where: { role } });
  if (!roleRecord) return [];

  return prisma.slides.findMany({
    where: {
      is_active: true,
      is_deleted: false,
      slide_role_assignments: { some: { role_id: roleRecord.id } },
    },
    orderBy: { created_at: 'asc' },
  });
};

export const hasCompletedOnboarding = async (userId) => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { is_onboarding_complete: true },
  });
  return user?.is_onboarding_complete === true;
};

export const completeOnboarding = async (userId) => {
  const user = await prisma.users.update({
    where: { id: userId },
    data: { is_onboarding_complete: true , updated_at: new Date(), },
    include: { user_role_assignments: { include: { user_roles: true } } },
  });

  return user.user_role_assignments?.[0]?.user_roles?.role || 'tenant';
};

export const getLinkedRoles = async (userId) => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: { user_role_assignments: { include: { user_roles: true } } },
  });
  if (!user) throw new NotFoundError('User not found');

  const roles = user.user_role_assignments.map((a) => a.user_roles.role);
  return {
    user_id: userId,
    roles,
    active_role: user.active_role || roles[0] || null,
  };
};

export const switchRole = async (userId, targetRole) => {
  const assignments = await getLinkedRoles(userId);
  if (!assignments.roles.includes(targetRole)) {
    throw new ForbiddenError('You have not registered as this role', { field: 'target_role' });
  }

  await prisma.users.update({
    where: { id: userId },
    data: { active_role: targetRole, updated_at: new Date(), },
    
  });

  const token = generateToken({ id: userId, role: targetRole });

  return {
    message: 'Role switched successfully',
    active_role: targetRole,
    token,
    redirect_to: `/dashboard/${targetRole}`,
  };
};

export const addRole = async (userId, newRole) => {
  const roleRecord = await prisma.user_roles.findFirst({ where: { role: newRole } });
  if (!roleRecord) throw new ValidationError('Invalid role specified');

  const exists = await prisma.user_role_assignments.findFirst({
    where: { user_id: userId, role_id: roleRecord.id },
  });
  if (exists) {
    throw new ValidationError('This role is already linked to your account', { field: 'new_role' });
  }

  await prisma.user_role_assignments.create({
    data: { id: uuidv4(), user_id: userId, role_id: roleRecord.id },
  });

  return {
    message: 'New role added successfully',
    redirect_to: `/profile/setup?role=${newRole}`,
  };
};

export const checkProfileStatus = async (userId) => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { is_profile_complete: true },
  });
  if (!user) throw new NotFoundError('User not found');
  return { profile_complete: user.is_profile_complete };
};

export default {
  handleOtpRequest,
  verifyOtp,
  setUserRole,
  completeProfile,
  getSlidesByRole,
  hasCompletedOnboarding,
  completeOnboarding,
  getLinkedRoles,
  switchRole,
  addRole,
  checkProfileStatus,
};
