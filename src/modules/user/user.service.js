import prisma from '../../prisma-client.js';
import OTPService from '../auth/otp.service.js';
import { isEmail } from '../../common/utils/check-user-identifier.utiil.js'
import { uploadToStorage } from '../../common/services/s3.service.js';
import { validatePhoneNumber, validateEmail, validateUsername } from '../../common/services/user-validation.service.js';

import {
    ValidationError,
    NotFoundError,
    AuthError,
    ForbiddenError,
    ServerError,
} from '../../common/services/errors-builder.service.js';

export const updateUsername = async (userId, username) => {
    
    await validateUsername(username)

    const user = await prisma.users.update({
        where: { id: userId, is_deleted: false },
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
    const user = await prisma.users.findUnique({ where: { id: userId, is_deleted: false} });

    if (!user || user.email !== old_email) throw new NotFoundError('Old email does not match our records', { field: 'Old email' });

    await OTPService.sendOtp(new_email);

    return { otp_sent: true, sent_otp_to: new_email }
}

export const confirmEmailOtpAndUpdate = async (userId, otp, new_email) => {
    const isValid = await  OTPService.verifyOtp(new_email, otp);
    if (!isValid) throw new AuthError('Invalid or expired OTP', { field: 'Otp' });

    await validateEmail(new_email)

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
    
    if (!user || user.phone_number !== old_phone) throw new NotFoundError('Old phone does not match our records', { field: 'Old Phone' });

    await OTPService.sendOtp(new_phone);

    return { otp_sent: true, sent_otp_to: new_phone }
    
}

export const confirmPhoneOtpAndUpdate = async (userId, otp, new_phone) => {
    const isValid = await  OTPService.verifyOtp(new_phone, otp);
    
    if (!isValid) throw new AuthError('Invalid or expired OTP', { field: 'Otp' });

    await validatePhoneNumber(new_phone)

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

    if(isEmailIdentifier) {
      await validateEmail(identifier)
    } else {
      await validatePhoneNumber(identifier)
    }
  
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { [contactField]: true }
    });
  
    if (!user) throw new ForbiddenError('User not found', { field: 'User ID' });
  
    if (user[contactField]) {
      throw new ValidationError(`User already has a ${contactField} set`, {
        field: contactField
      });
    }
  
    const isValid = await OTPService.verifyOtp(identifier, otp);
    if (!isValid) {
      throw new AuthError('Invalid or expired OTP', { field: 'Otp' });
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
    const profilePicUrl = await uploadToStorage(profileFile.buffer, profileFile.originalname);

    const updateUser = await prisma.users.update({
        where: {id: userId, is_deleted: false},
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

  if (!user) throw new NotFoundError('User not found', { field: 'User ID' });

  const isMatching = identifier === user.email || identifier === user.phone_number;
  if (!isMatching) throw new AuthError('Invalid contact info', { field: 'Contact' });

  const isValid = await OTPService.verifyOtp(identifier, otp);
  if (!isValid) {
    throw new AuthError('Invalid or expired OTP', { field: 'Otp' });
  }

  if(user.is_deleted) throw new AuthError('Account already deleted');
  
  await prisma.users.update({
    where: { id: userId },
    data: {
      is_deleted: true,
      deleted_at: new Date(),
      updated_at: new Date(),
    },
  });

  return { message: 'Account marked for deletion. You have 30 days to recover it.' };
};

export const permanentlyDeleteUser = async (userId) => {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { is_deleted: true },
    });
  
    if (!user?.is_deleted) throw new ForbiddenError('User must be marked as deleted first');
  
    await prisma.users.delete({ where: { id: userId } });
};

export const getUser = async (userId) => {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone_number: true,
        profile_picture_path: true,
      },
    });
  
    if (!user) {
      throw new NotFoundError('User not found', { field: 'User ID' });
    }
  
    return {
      user_id: user.id,
      email: user.email,
      phone_number: user.phone_number,
      profile_pic: user.profile_picture_path
    };
};

export const recoverAccount = async (userId) => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { is_deleted: true, deleted_at: true }
  });

  if (!user) throw new NotFoundError('User not found', { field: 'User ID' });
  if (!user.is_deleted) throw new AuthError('Account is not deleted');
  
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const deletedAt = user.deleted_at;
  if (!deletedAt || (Date.now() - new Date(deletedAt).getTime()) > THIRTY_DAYS_MS) {
    throw new AuthError('Account cannot be recovered, permanent deletion period passed');
  }

  await prisma.users.update({
    where: { id: userId },
    data: {
      is_deleted: false,
      deleted_at: null,
      updated_at: new Date(),
    }
  });

  return { message: 'Account recovered successfully' };
};

export const getAccountDeletionInfo = async (userId) => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      is_deleted: true,
      deleted_at: true,
    }
  });

  if (!user) throw new NotFoundError('User not found', { field: 'User ID' });

  if (!user.is_deleted || !user.deleted_at) {
    return {
      is_deleted: false,
      deleted_at: null,
      time_remaining: null
    };
  }

  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const deletedAt = new Date(user.deleted_at);
  const timeElapsed = Date.now() - deletedAt.getTime();
  const timeRemaining = Math.max(0, THIRTY_DAYS_MS - timeElapsed);

  return {
    is_deleted: true,
    deleted_at: deletedAt,
    time_remaining: timeRemaining // milliseconds
  };
};


export default {
    updateUsername,
    requestEmailOtp,
    confirmEmailOtpAndUpdate,
    requestPhoneOtp,
    confirmPhoneOtpAndUpdate,
    addContact,
    sendOtpToContact,
    updateProfilePicture,
    deleteAccount,
    getUser,
    permanentlyDeleteUser,
    recoverAccount,
    getAccountDeletionInfo, 
}