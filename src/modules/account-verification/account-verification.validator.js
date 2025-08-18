import Joi from 'joi';

export const verificationRequestSchema = {
  body: Joi.object({
    ownership_comment: Joi.string().max(500).optional().messages({
      'string.max': 'Ownership comment must not exceed 500 characters',
    }),
  }),
};

export const updateVerificationRequestSchema = {
  body: Joi.object({
    ownership_comment: Joi.string().max(500).optional().messages({
      'string.empty': 'Ownership comment is required',
      'string.max': 'Ownership comment must not exceed 500 characters',
    }),
  }),
  params: Joi.object({
    requestId: Joi.string().uuid().required().messages({
      'string.uuid': 'Request ID must be a valid UUID',
      'any.required': 'Request ID is required',
    }),
  }),
};


export const adminVerificationRequestResponseSchema = {
  body: Joi.object({
    status: Joi.string().valid('approved', 'rejected').required().messages({
      'any.only': 'Status must be either "approved" or "rejected"',
      'any.required': 'Status is required',
    }),
    review_notes: Joi.string().max(500).optional().allow('').messages({
      'string.max': 'Review notes must not exceed 500 characters',
    }),
  }),
  params: Joi.object({
    requestId: Joi.string().uuid().required().messages({
      'string.uuid': 'Request ID must be a valid UUID',
      'any.required': 'Request ID is required',
    }),
  }),
};

export const propertyVerificationStatusParamSchema = {
  params: Joi.object({
    propertyId: Joi.string().uuid().required().messages({
      'string.uuid': 'Property ID must be a valid UUID',
      'any.required': 'Property ID is required',
    }),
  }),
};

export const verificationBadgePaymentSchema = {
  body: Joi.object({
    phone_number: Joi.string().required().messages({
      'string.empty': 'Phone number is required',
    }),
  }),
};
