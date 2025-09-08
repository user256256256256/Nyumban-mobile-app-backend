import prisma from '../../prisma-client.js';
import OTPService from '../../common/services/otp.service.js';
import { generateToken } from '../../common/utils/jwt.util.js';
import { v4 as uuidv4 } from 'uuid';
import { uploadToStorage } from '../../common/services/s3.service.js';
import { EmailService } from '../../common/services/email.service.js';
import { isEmail } from '../../common/utils/check-user-identifier.utiil.js'
import { generateUniqueLandlordCode, generateUniqueTenantCode } from '../../common/utils/user-code-generator.util.js';
import { validatePhoneNumber, validateEmail, validateUsername } from '../../common/services/user-validation.service.js';

import {
  ValidationError,
  NotFoundError,
  AuthError,
  ForbiddenError,
  ServerError,
} from '../../common/services/errors-builder.service.js';

export const handleOtpRequest = async (identifier) => {
  await OTPService.sendOtp(identifier);
  return {
    message: 'OTP sent to email or phone number',
    next_step: 'Verify OTP',
    identifier,
  };
};

export const verifyOtp = async (identifier, otp) => {
  const isIdentifierEmail = isEmail(identifier);
  const where = isIdentifierEmail
    ? { email: identifier }
    : { phone_number: identifier };

  // Step 1: Validate OTP
  const isValid = await OTPService.verifyOtp(identifier, otp);
  if (!isValid) {
    throw new AuthError('Invalid or expired OTP', { field: 'Otp' });
  }

  // Step 2: Find or create user
  let user = await prisma.users.findUnique({ where });

  if (!user) {
    // Before creating, validate format & uniqueness
    if (isIdentifierEmail) {
      await validateEmail(identifier);
    } else {
      await validatePhoneNumber(identifier);
    }

    const data = isIdentifierEmail
      ? { email: identifier, is_email_confirmed: true }
      : { phone_number: identifier, is_phone_number_confirmed: true };

    user = await prisma.users.create({ data });

      // Create default notification preferences
      await prisma.user_notification_preferences.create({
        data: {
          user_id: user.id,
          notify_nyumban_updates: true,
          notify_payment_sms: true,
        },
      });
      
  } else {
    // Update confirmation flags if user exists
    await prisma.users.update({
      where: { id: user.id },
      data: isIdentifierEmail
        ? { is_email_confirmed: true, updated_at: new Date() }
        : { is_phone_number_confirmed: true, updated_at: new Date() },
    });
  }

  // Step 3: Get assigned role (if exists)
  const roleAssignment = await prisma.user_role_assignments.findFirst({
    where: { user_id: user.id },
    include: { user_roles: true },
  });

  const assignedRole = roleAssignment?.user_roles?.role || null;

  // Step 4: Generate token
  const token = generateToken({ id: user.id, role: assignedRole });

  // Step 5: Final response
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
  if (!userId) throw new ValidationError('User ID is required', { field: 'User Id' });

  const roles = Array.isArray(roleInput) ? roleInput : [roleInput];

  const roleRecords = await prisma.user_roles.findMany({
    where: { role: { in: roles } },
  });

  if (roleRecords.length !== roles.length) {
    throw new ValidationError('Invalid role(s) specified', { field: 'Role Input' });
  }

  const existingAssignments = await prisma.user_role_assignments.findMany({
    where: {
      user_id: userId,
      role_id: { in: roleRecords.map(r => r.id) }
    }
  });

  if (existingAssignments.length > 0) {
    const alreadyAssignedRoles = existingAssignments
      .map(assignment => roleRecords.find(r => r.id === assignment.role_id)?.role)
      .filter(Boolean);

    throw new ValidationError(
      `User already has the following role(s): ${alreadyAssignedRoles.join(', ')}`,
      { field: 'Role Input' }
    );
  }

  const createAssignments = roleRecords.map((role) =>
    prisma.user_role_assignments.create({
      data: { id: uuidv4(), user_id: userId, role_id: role.id },
    })
  );

  const updateUserActiveRole = prisma.users.update({
    where: { id: userId },
    data: { active_role: roles[0], updated_at: new Date() },
  });

  await prisma.$transaction([...createAssignments, updateUserActiveRole]);

  if (roles.includes('landlord')) await createLandlordProfile(userId);
  if (roles.includes('tenant')) await createTenantProfile(userId);

  const token = generateToken({ id: userId, role: roles[0] });

  return {
    message: 'Role(s) saved successfully',
    redirect_to: `/dashboard/${roles[0]}`,
    token,
  };
};

export const completeProfile = async (userId, userName, profileFile) => {
  let profilePicUrl = null;

  await validateUsername(userName)

  if (profileFile) {
    profilePicUrl = await uploadToStorage(profileFile.buffer, profileFile.originalname );
  }

  // Update user profile
  await prisma.users.update({
    where: { id: userId },
    data: {
      username: userName,
      profile_picture_path: profilePicUrl,
      is_profile_complete: true,
      updated_at: new Date(),
    },
  });

  // Fetch user's active role
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { active_role: true },
  });

  let redirectTo = '/dashboard';

  if (user?.active_role) {
    redirectTo = `/dashboard/${user.active_role.toLowerCase()}`;
  }

  return {
    message: 'Profile completed successfully',
    redirect_to: redirectTo,
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
    where: { id: userId, is_deleted: false },
    select: { is_onboarding_complete: true },
  });
  return user?.is_onboarding_complete === true;
};

export const completeOnboarding = async (userId) => {
  const user = await prisma.users.update({
    where: { id: userId, is_deleted: false },
    data: { is_onboarding_complete: true , updated_at: new Date(), },
    include: { user_role_assignments: { include: { user_roles: true } } },
  });

  if(!user) throw new ServerError('Failed to complete Onboarding');

  if (user.email) {
    try {
      await EmailService.sendWelcomeEmail({
        email: user.email,
        username: user.username,
      })
    } catch (error) {
      console.error('Welcome email failed:', error); // Non-blocking
    }
  }
  
  return user.user_role_assignments?.[0]?.user_roles?.role || 'tenant';
};

export const getLinkedRoles = async (userId) => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: { user_role_assignments: { include: { user_roles: true } } },
  });
  if (!user) throw new NotFoundError('User not found', { field: 'User ID' });

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
    throw new ForbiddenError(`You have not registered the ${targetRole} role`, { field: 'Target Role' });
  }

  await prisma.users.update({
    where: { id: userId, is_deleted: false },
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
  if (!roleRecord) throw new ValidationError('Invalid role specified', { field: 'Role Name' });

  const exists = await prisma.user_role_assignments.findFirst({
    where: { user_id: userId, role_id: roleRecord.id },
  });

  if (exists) {
    throw new ValidationError('This role is already linked to your account', { field: 'New Role' });
  }

  await prisma.user_role_assignments.create({
    data: { id: uuidv4(), user_id: userId, role_id: roleRecord.id },
  });

  if (newRole === 'landlord') {
    await createLandlordProfile(userId);
  } else if (newRole === 'tenant') {
    await createTenantProfile(userId);
  }

  return {
    message: 'New role added successfully',
  };
};

export const checkProfileStatus = async (userId) => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { is_profile_complete: true, active_role: true },
  });

  if (!user) throw new NotFoundError('User not found', { field: 'User ID' });

  if (!user.is_profile_complete) {
    return { profile_complete: false };
  }

  return {
    profile_complete: true,
    redirect_to: `dashboard/${user.active_role}`,
  };
};

const createLandlordProfile = async (userId) => {
  const existing = await prisma.landlord_profiles.findUnique({ where: { user_id: userId } });
  if (existing) return;

  const landlordCode = await generateUniqueLandlordCode();
  await prisma.landlord_profiles.create({
    data: {
      id: uuidv4(),
      user_id: userId,
      landlord_code: landlordCode,
    },
  });
};

const createTenantProfile = async (userId) => {
  const existing = await prisma.tenant_profiles.findUnique({ where: { user_id: userId, is_deleted: false } });
  if (existing) return;

  const tenantCode = await generateUniqueTenantCode();
  await prisma.tenant_profiles.create({
    data: {
      id: uuidv4(),
      user_id: userId,
      tenant_code: tenantCode,
    },
  });
};

export const getActiveUserRole = async (userId) => {
  if (!userId) {
    throw new AuthError('User not authenticated',  { field: 'User ID' });
  }

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      active_role: true,
    },
  });

  if (!user || !user.active_role) {
    throw new NotFoundError('Active role not set for user');
  }

  return {
    active_role: user.active_role
  };
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
  getActiveUserRole,
};
