import express from 'express';
import { authenticate } from '../auth/auth.middleware.js'; 
import { uploadImage } from '../../common/middleware/upload.middleware.js'

import {
    updateUsername,
    requestEmailOtpHandler,
    confirmEmailOtpAndUpdateHandler,
    requestPhoneOtpHandler,
    confirmPhoneOtpAndUpdateHandler,
    addContactHandler,
    requestContactOtpHandler,
    updateProfilePicture,
    deleteAccountHandler,
    getUserHandler,
    permanentlyDeleteHandler,
    recoverAccountHandler,
    getAccountDeletionInfoHandler,
} from './user.controller.js';

import { validate } from '../../common/middleware/validate.middleware.js';
import { updateUsernameSchema, requestEmailOtpSchema, updateEmailSchema, requestPhoneOtpSchema, updatePhoneSchema, addContactSchema, requestContactOtpSchema, deleteAccountSchema, } from './user.validator.js';

const router = express.Router();

router.put('/change-username', authenticate, validate(updateUsernameSchema), updateUsername);
router.post('/change-email-otp-request', authenticate, validate(requestEmailOtpSchema), requestEmailOtpHandler);
router.put('/change-email-confrim-otp-request', authenticate, validate(updateEmailSchema), confirmEmailOtpAndUpdateHandler);
router.post('/change-phone-otp-request', authenticate, validate(requestPhoneOtpSchema), requestPhoneOtpHandler);
router.post('/change-phone-confrim-otp-request', authenticate, validate(updatePhoneSchema), confirmPhoneOtpAndUpdateHandler)
router.post('/add-contact', authenticate, validate(requestContactOtpSchema), requestContactOtpHandler)
router.put('/confirm-added-contact', authenticate, validate(addContactSchema), addContactHandler);
router.put('/update-profile-pic', authenticate, uploadImage.single('profile_picture'), updateProfilePicture)
router.delete('/soft-delete', authenticate, validate(deleteAccountSchema), deleteAccountHandler)
router.get('/user-info', authenticate, getUserHandler);
router.delete('/permanent-delete', authenticate, permanentlyDeleteHandler);
router.post('/recover-account', authenticate, recoverAccountHandler);
router.get('/account-deletion-info', authenticate, getAccountDeletionInfoHandler);


export default router;

