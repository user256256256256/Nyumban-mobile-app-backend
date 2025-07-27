import UserService from './user.service.js'
import { success } from '../../common/utils/response-builder.util.js'
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js'

export const updateUsername = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { username } = req.body;

        const result = await UserService.updateUsername(userId, username);
        return success(res, result, 'Name updated successfully');
    } catch (error) {
        return handleControllerError(res, error, 'UPDATE_USERNAME_FAILED', 'Failed to update name');
    }
}

export const requestEmailOtpHandler = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { old_email, new_email} = req.body;
        
        const result = await UserService.requestEmailOtp(userId, old_email, new_email);
        return success(res, result, 'Otp sent to new email')
    } catch (error) {
        return handleControllerError(res, error, 'EMAIL_OTP_REQUEST_FAILED', 'Failed to send email OTP');
    }
}

export const confirmEmailOtpAndUpdateHandler = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { otp, new_email } = req.body;

        const result = await UserService.confirmEmailOtpAndUpdate(userId, otp, new_email);
        return success(res, result, 'Email updated successfully')
    } catch (error) {
        return handleControllerError(res, error, 'EMAIL_UPDATE_FAILED', 'Failed to update email');
    }
}

export const requestPhoneOtpHandler = async (req, res ) => {
    try {
        const userId = req.user?.id;
        const { old_phone, new_phone } = req.body;

        const result = await UserService.requestPhoneOtp(userId, old_phone, new_phone);
        return success(res, result, 'OTP sent to new phone number');
    } catch (error) {
        return handleControllerError(res, error, 'PHONE_OTP_REQUEST_FAILED', 'Failed to send OTP');
    }
}

export const confirmPhoneOtpAndUpdateHandler = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { otp, new_phone } = req.body;

        const result = await UserService.confirmPhoneOtpAndUpdate( userId, otp, new_phone);
        return success(res, result, 'Phone number updated successfully');
    } catch (error) {
        return handleControllerError(res, error, 'UPDATE_PHONE_FAILED', 'Failed to update phone number')
    }
}

export const addContactHandler = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { otp, identifier } = req.body;
        
        const result = await UserService.addContact(userId, otp, identifier);
        return success(res, result, 'Contact information added successfully');
    } catch (error) {
        return handleControllerError(res, error, 'ADD_CONTACT_FAILED', 'Failed to add contact info');
    }
}

export const requestContactOtpHandler = async (req, res) => {
    try {
        const { identifier } = req.body;
        const result = await UserService.sendOtpToContact(identifier);
        return success(res, result, 'OTP sent successfully');
    } catch (error) {
        return handleControllerError(res, error, 'OTP_REQUEST_FAILED', 'Failed to send OTP');
    }
}

export const updateProfilePicture = async (req, res) => {
    try {
        const userId = req.user?.id;
        const profileFile = req.file;

        if (!file) {
            return handleControllerError(res, {
                code: 'BAD_REQUEST',
                message: 'Profile picture is required',
                status: 400
            }, 'BAD_REQUEST', 'Profile picture is required', 401);
        }

        const result = await UserService.updateProfilePicture(userId, profileFile)
        return success(res, result, 'Profile picture updated successfully')
    } catch (error) {
        return handleControllerError(res, error, 'PROFILE_PICTURE_UPDATE_FAILED', 'Failed to update Profile picture');
    }
}

export const deleteAccountHandler = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { otp, contact } = req.body;
        const result = await UserService.deleteAccount(userId, otp, contact);
        return success(res, result, 'Account successfully deleted');
    } catch (error) {
        return handleControllerError(res, error, 'ACCOUNT_DELETION_FAILED', 'Failed to delete account');
    }
}

// For Administrators Only
export const permanentlyDeleteHandler = async (req, res) => {
    try {
      const userId = req.user?.id;
      await UserService.permanentlyDeleteUser(userId);
      return success(res, null, 'User permanently deleted');
    } catch (error) {
      return handleControllerError(res, error, 'PERMANENT_DELETE_FAILED', 'Failed to delete permanently');
    }
};

export const recoverAccountHandler = async (req, res) => {
    try {
      const userId = req.user?.id;
      const result = await UserService.recoverAccount(userId);
      return success(res, result, 'Account recovered successfully');
    } catch (error) {
      return handleControllerError(res, error, 'ACCOUNT_RECOVERY_FAILED', 'Failed to recover account');
    }
};  
export const getUserContactHandler = async (req, res) => {
    try {
      const userId = req.user?.id;
      const contact = await UserService.getUserContact(userId);
      return success(res, contact, 'User contact fetched successfully');
    } catch (err) {
      return handleControllerError(res, err, 'GET_CONTACT_FAILED', 'Failed to retrieve user contact');
    }
};