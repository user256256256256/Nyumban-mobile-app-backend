import Joi from 'joi';
import { VALID_ROLES } from '../../common/constants/roles.constants.js'; // Adjust path as needed

// Used for both email and phone
const identifierSchema = Joi.alternatives().try(
  Joi.string().email(),
  Joi.string().pattern(/^\+?[1-9][0-9]{7,14}$/)
).required();

export const requestOtpSchema = Joi.object({
  identifier: identifierSchema
});

export const verifyOtpSchema = Joi.object({
  identifier: Joi.string().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required()
});

export const submitRoleSchema = Joi.object({
  role: Joi.alternatives().try(
    Joi.string().valid(...VALID_ROLES),
    Joi.array().items(Joi.string().valid(...VALID_ROLES)).min(1).max(VALID_ROLES.length)
  ).required()
});

export const completeProfileSchema = Joi.object({
  user_name: Joi.string().required().messages({
    'string.empty': 'Name is required',
  }),
  profile_picture: Joi.any().optional() // Can be refined if using multer, e.g., buffer check
});

export const switchRoleSchema = Joi.object({
  target_role: Joi.string().valid(...VALID_ROLES).required()
});

export const addRoleSchema = Joi.object({
  new_role: Joi.string().valid(...VALID_ROLES).required()
});
