import Joi from 'joi';

export const updateUsernameSchema = Joi.object({
  username: Joi.string().min(2).required().messages({
    'string.empty': 'Name is required',
  })
});

export const requestEmailOtpSchema = Joi.object({
  old_email: Joi.string().email().required(),
  new_email: Joi.string().email().required()
});

export const updateEmailSchema = Joi.object({
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  new_email: Joi.string().email().required()
});

export const requestPhoneOtpSchema = Joi.object({
  old_phone: Joi.string().pattern(/^\+?[1-9][0-9]{7,14}$/).required(),
  new_phone: Joi.string().pattern(/^\+?[1-9][0-9]{7,14}$/).required()
});

export const updatePhoneSchema = Joi.object({
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  new_phone: Joi.string().pattern(/^\+?[1-9][0-9]{7,14}$/).required()
});

export const addContactSchema = Joi.object({
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  identifier: Joi.alternatives().try(
    Joi.string().email(),
    Joi.string().pattern(/^\+?[1-9][0-9]{7,14}$/)
  ).required()
});

export const updateProfilePictureSchema = Joi.object({
  profile_picture: Joi.any().required()
});


export const requestContactOtpSchema = Joi.object({
  identifier: Joi.alternatives().try(
    Joi.string().email(),
    Joi.string().pattern(/^\+?[1-9][0-9]{7,14}$/)
  ).required()
});

export const deleteAccountSchema = Joi.object({
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  contact: Joi.alternatives().try(
    Joi.string().email(),
    Joi.string().pattern(/^\+?[1-9][0-9]{7,14}$/)
  ).required()
});
