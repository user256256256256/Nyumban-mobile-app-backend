import Joi from 'joi';

export const updateUsernameSchema = {
  body: Joi.object({
    username: Joi.string().min(2).required().label('Username').messages({
      'string.empty': 'Username is required',
      'string.min': 'Username must be at least 2 characters',
      'any.required': 'Username is required',
    }),
  }),
};

export const requestEmailOtpSchema = {
  body: Joi.object({
    old_email: Joi.string().email().required().label('Old Email').messages({
      'string.email': 'Old email must be valid',
      'any.required': 'Old email is required',
    }),
    new_email: Joi.string().email().required().label('New Email').messages({
      'string.email': 'New email must be valid',
      'any.required': 'New email is required',
    }),
  }),
};

export const updateEmailSchema = {
  body: Joi.object({
    otp: Joi.string().length(6).pattern(/^\d+$/).required().label('OTP').messages({
      'string.length': 'OTP must be exactly 6 digits',
      'string.pattern.base': 'OTP must contain only digits',
      'any.required': 'OTP is required',
    }),
    new_email: Joi.string().email().required().label('New Email').messages({
      'string.email': 'New email must be valid',
      'any.required': 'New email is required',
    }),
  }),
};

export const requestPhoneOtpSchema = {
  body: Joi.object({
    old_phone: Joi.string().pattern(/^\+?[1-9][0-9]{7,14}$/).required().label('Old Phone').messages({
      'string.pattern.base': 'Old phone must be in international format',
      'any.required': 'Old phone is required',
    }),
    new_phone: Joi.string().pattern(/^\+?[1-9][0-9]{7,14}$/).required().label('New Phone').messages({
      'string.pattern.base': 'New phone must be in international format',
      'any.required': 'New phone is required',
    }),
  }),
};

export const updatePhoneSchema = {
  body: Joi.object({
    otp: Joi.string().length(6).pattern(/^\d+$/).required().label('OTP').messages({
      'string.length': 'OTP must be exactly 6 digits',
      'string.pattern.base': 'OTP must contain only digits',
      'any.required': 'OTP is required',
    }),
    new_phone: Joi.string().pattern(/^\+?[1-9][0-9]{7,14}$/).required().label('New Phone').messages({
      'string.pattern.base': 'New phone must be in international format',
      'any.required': 'New phone is required',
    }),
  }),
};

export const addContactSchema = {
  body: Joi.object({
    otp: Joi.string().length(6).pattern(/^\d+$/).required().label('OTP').messages({
      'string.length': 'OTP must be exactly 6 digits',
      'string.pattern.base': 'OTP must contain only digits',
      'any.required': 'OTP is required',
    }),
    identifier: Joi.alternatives().try(
      Joi.string().email(),
      Joi.string().pattern(/^\+?[1-9][0-9]{7,14}$/)
    ).required().label('Identifier').messages({
      'alternatives.match': 'Identifier must be a valid email or phone number',
      'any.required': 'Identifier is required',
    }),
  }),
};

export const updateProfilePictureSchema = {
  body: Joi.object({
    profile_picture: Joi.any().required().label('Profile Picture').messages({
      'any.required': 'Profile picture is required',
    }),
  }),
};

export const requestContactOtpSchema = {
  body: Joi.object({
    identifier: Joi.alternatives().try(
      Joi.string().email(),
      Joi.string().pattern(/^\+?[1-9][0-9]{7,14}$/)
    ).required().label('Identifier').messages({
      'alternatives.match': 'Identifier must be a valid email or phone number',
      'any.required': 'Identifier is required',
    }),
  }),
};

export const deleteAccountSchema = {
  body: Joi.object({
    otp: Joi.string().length(6).pattern(/^\d+$/).required().label('OTP').messages({
      'string.length': 'OTP must be exactly 6 digits',
      'string.pattern.base': 'OTP must contain only digits',
      'any.required': 'OTP is required',
    }),
    contact: Joi.alternatives().try(
      Joi.string().email(),
      Joi.string().pattern(/^\+?[1-9][0-9]{7,14}$/)
    ).required().label('Contact').messages({
      'alternatives.match': 'Contact must be a valid email or phone number',
      'any.required': 'Contact is required',
    }),
  }),
};
