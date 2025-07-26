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
    getUserContactHandler,
    permanentlyDeleteHandler,
    recoverAccountHandler,
} from './user.controller.js';

import { validate } from '../../common/middleware/validate.middleware.js';
import { updateUsernameSchema, requestEmailOtpSchema, updateEmailSchema, requestPhoneOtpSchema, updatePhoneSchema, addContactSchema, requestContactOtpSchema, deleteAccountSchema, } from './user.validator.js';

const router = express.Router();

router.put('/profile/username', authenticate, validate(updateUsernameSchema), updateUsername);
router.post('/profile/email/otp-request', authenticate, validate(requestEmailOtpSchema), requestEmailOtpHandler);
router.put('/profile/email', authenticate, validate(updateEmailSchema), confirmEmailOtpAndUpdateHandler);
router.post('/profile/phone/otp-request', authenticate, validate(requestPhoneOtpSchema), requestPhoneOtpHandler);
router.post('/profile/phone', authenticate, validate(updatePhoneSchema), confirmPhoneOtpAndUpdateHandler)
router.post('/profile/contact/otp-request', authenticate, validate(requestContactOtpSchema), requestContactOtpHandler)
router.put('/profile/contact', authenticate, validate(addContactSchema), addContactHandler);
router.put('/profile/photo', authenticate, uploadImage.single('profile_picture'), updateProfilePicture)
router.delete('/account/delete', authenticate, validate(deleteAccountSchema), deleteAccountHandler)
router.get('/profile/contact', authenticate, getUserContactHandler);
router.delete('/account/permanent-delete', authenticate, permanentlyDeleteHandler);
router.post('/account/recover', authenticate, recoverAccountHandler);


export default router;

