import prisma from '../../prisma-client.js';
import OTPService from '../auth/otp.service.js';
import { isEmail } from '../../common/utils/checkUserIdentifier.js'
import { uploadToStorage } from '../../common/services/s3.service.js';

import {
    ValidationError,
    NotFoundError,
    AuthError,
    ForbiddenError,
    ServerError,
} from '../../common/services/errors.js';

export const updateUsername = async (userId, username) => {
    const user = await prisma.users.update({
        where: { id: userId },
        data: {
            username,
            updated_at: new Date()
        },
        select: {
            id: true,
            username: true
        }
    });
    
    return user
}

export const requestEmailOtp = async (userId, old_email, new_email) => {
    const user = await prisma.users.findUnique({ where: { id: userId } });

    if (!user || user.email !== old_email) throw new NotFoundError('Old email does not match our records');

    await OTPService.sendOtp(new_email);

    return { otp_sent: true, sent_otp_to: new_email }
}

export const confirmEmailOtpAndUpdate = async (userId, otp, new_email) => {
    const isValid = await  OTPService.verifyOtp(new_email, otp);
    if (!isValid) throw new AuthError('Invalid or expired OTP', { field: 'otp' });

    const updateUser = await prisma.users.update({
        where: {id: userId},
        data: {
            email: new_email,
            is_email_confirmed: true, 
            updated_at: new Date(),
        },
        select: {
            id: true,
            email: true, 
            is_email_confirmed: true,
        }
    })

    return updateUser

}

export const requestPhoneOtp = async (userId, old_phone, new_phone) => {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    
    if (!user || user.phone_number !== old_phone) throw new NotFoundError('Old phone does not match our records');

    await OTPService.sendOtp(new_phone);

    return { otp_sent: true, sent_otp_to: new_phone }
    
}

export const confirmPhoneOtpAndUpdate = async (userId, otp, new_phone) => {
    const isValid = await  OTPService.verifyOtp(new_phone, otp);
    if (!isValid) throw new AuthError('Invalid or expired OTP', { field: 'otp' });

    const updateUser = await prisma.users.update({
        where: {id: userId},
        data: {
            phone_number: new_phone,
            is_phone_number_confirmed: true,
            updated_at: new Date(),
        },
        select: {
            id: true,
            phone_number: true, 
            is_phone_number_confirmed: true,
        }
    })

    return updateUser

}

export const addContact = async (userId, otp, identifier) => {
    const isEmailIdentifier = isEmail(identifier);
    const contactField = isEmailIdentifier ? 'email' : 'phone_number';
    const confirmationField = isEmailIdentifier ? 'is_email_confirmed' : 'is_phone_number_confirmed';
  
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { [contactField]: true }
    });
  
    if (!user) throw new ForbiddenError('User not found');
  
    if (user[contactField]) {
      throw new ValidationError(`User already has a ${contactField} set`, {
        field: contactField
      });
    }
  
    const isValid = await OTPService.verifyOtp(identifier, otp);
    if (!isValid) {
      throw new AuthError('Invalid or expired OTP', { field: 'otp' });
    }
  
    const updateUser = await prisma.users.update({
      where: { id: userId },
      data: {
        [contactField]: identifier,
        [confirmationField]: true,
        updated_at: new Date()
      },
      select: {
        id: true,
        [contactField]: true,
        [confirmationField]: true
      }
    });
  
    return updateUser;
};
  

export const sendOtpToContact = async (identifier) => {
    await OTPService.sendOtp(identifier);
    return {
        message: 'OTP sent to email or phone number',
        identifier,
    }
}

export const updateProfilePicture = async (userId, profileFile) => {
    const profilePicUrl = await uploadToStorage(profileFile.buffer, profileFile.originalName);

    const updateUser = await prisma.users.update({
        where: {id: userId},
        data: {
            profile_picture_path: profilePicUrl, 
            updated_at: new Date(),
        },
        select: {
            profile_picture_path: true,
        },
    });

    return updateUser;
}

export const deleteAccount = async (userId, otp, identifier) => {
    const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { email: true, phone_number: true }
    });
    
    if (!user) throw new NotFoundError('User not found');

    const isMatching = identifier === user.email || identifier === user.phone_number;
    if (!isMatching) throw new AuthError('Invalid contact info', {field: 'contact'});

    const isValid = await OTPService.verifyOtp(identifier, otp);
    if (!isValid) {
      throw new AuthError('Invalid or expired OTP', { field: 'otp' });
    }
    
    await prisma.users.delete({where: {id: userId}});

    return; 
}

export default {
    updateUsername,
    requestEmailOtp,
    confirmEmailOtpAndUpdate,
    requestPhoneOtp,
    confirmPhoneOtpAndUpdate,
    addContact,
    sendOtpToContact,
    updateProfilePicture,
    deleteAccount
}