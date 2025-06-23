import prisma from '../../prisma-client.js';
import OTPService from './otp.service.js';
import { generateToken } from '../../common/utils/jwt.js';

const isEmail = (identifier) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

/**
 * Handle OTP request for login/signup
 */
const handleOtpRequest = async (identifier) => {
    const where = isEmail(identifier)
        ? { email: identifier }
        : { phone_number: identifier };

    let user = await prisma.users.findUnique({ where });

    if (!user) {
        user = await prisma.users.create({
            data: {
                ...(isEmail(identifier)
                    ? { email: identifier }
                    : { phone_number: identifier }),
                is_profile_complete: false,
                is_onboarding_complete: false, 
            },
        });
    }

    await OTPService.sendOtp(identifier);
    return {
        message: 'OTP sent to email or phone number',
        next_step: 'verify_otp',
    };
};

/**
 * Verify OTP and return authentication token or prompt for role selection
 */
const verifyOtp = async (identifier, otp) => {
    const where = isEmail(identifier)
        ? { email: identifier }
        : { phone_number: identifier };

    const user = await prisma.users.findUnique({ where });

    if (!user) {
        return {
            status: 404,
            code: 'AUTH_401_UNAUTHORIZED',
            message: 'User not found',
        };
    }

    const isValid = await OTPService.verifyOtp(identifier, otp);
    if (!isValid) {
        return {
            status: 401,
            code: 'AUTH_401_UNAUTHORIZED',
            message: 'Invalid or expired OTP',
            details: { field: 'otp' },
        };
    }

    const roleAssignment = await prisma.user_role_assignments.findFirst({
        where: { user_id: user.id },
        include: { user_roles: true },
    });

    if (!roleAssignment || !roleAssignment.user_roles?.role) {
        return {
            message: 'OTP verified. Please choose a role.',
            requires_role_selection: true,
        };
    }

    const token = generateToken({
        id: user.id,
        role: roleAssignment.user_roles.role,
    });

    return {
        message: 'Authentication successful',
        token,
        redirect_to: `/dashboard/${roleAssignment.user_roles.role}`,
    };
};

/**
 * Assign role to user and return redirection info
 */
const setUserRole = async (userId, role) => {
    const roleRecord = await prisma.user_roles.findFirst({
        where: { role },
    });

    if (!roleRecord) {
        throw new Error('Invalid role specified');
    }

    await prisma.user_role_assignments.create({
        data: {
            user_id: userId,
            role_id: roleRecord.id,
        },
    });

    return {
        message: 'Role saved successfully',
        redirect_to: `/dashboard/${role}`,
    };
};

export default { handleOtpRequest, verifyOtp, setUserRole };
