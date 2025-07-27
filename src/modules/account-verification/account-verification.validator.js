import Joi from 'joi';

export const verificationRequestSchema = {
  body: Joi.object({
    ownership_comment: Joi.string().max(500).optional().messages({
      'string.empty': 'Ownership comment is required',
      'string.max': 'Ownership comment must not exceed 500 characters',
    }),
  }),
  file: Joi.any().required().meta({ fileField: true }).label('Proof Document'),
};

export const updateVerificationRequestSchema = {
  body: Joi.object({
    ownership_comment: Joi.string().max(500).optional().messages({
      'string.empty': 'Ownership comment is required',
      'string.max': 'Ownership comment must not exceed 500 characters',
    }),
  }),
  file: Joi.any().required().meta({ fileField: true }).label('Proof Document'),
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
    payment_method: Joi.string().valid('Flutterwave').required().messages({
      'any.only': 'Only Flutterwave is supported currently',
      'any.required': 'Payment method is required',
    }),
    phone_number: Joi.string().required().messages({
      'string.empty': 'Phone number is required',
    }),
    amount: Joi.number().min(1000).required().messages({
      'number.base': 'Amount must be a number',
      'number.min': 'Minimum amount is 1000',
    }),
    currency: Joi.string().valid('UGX', 'USD').required().messages({
      'any.only': 'Only UGX and USD are accepted currencies',
    }),
  }),
};
