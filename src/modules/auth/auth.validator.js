import Joi from "joi";

export const requestOtpSchema = Joi.object({
  identifier: Joi.alternatives().try(
    Joi.string().email(),
    Joi.string().pattern(/^\+?[1-9]\d{1,14}$/) 
  ).required()
});


export const verifyOtpSchema = Joi.object({
    identifier: Joi.string().required(),
    otp: Joi.string().length(6).required()
});

export const submitRoleSchema = Joi.object({
  role: Joi.string().valid('tenant', 'landlord').required()
});

export const completeProfileSchema = Joi.object({
  user_name: Joi.string().required().messages({
    'string.empty': 'Name is required',
  }),
  profile_picture: Joi.any(), 
})