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