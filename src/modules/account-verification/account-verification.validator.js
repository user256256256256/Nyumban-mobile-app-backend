import Joi from 'joi';

export const verificationRequestSchema = Joi.object({
  body: Joi.object({
    ownership_comment: Joi.string().max(500).required(),
    landlord_full_names: Joi.string().max(200).required(),
  }),
  file: Joi.any().required().meta({ fileField: true }).label('Proof Document')
});

export const adminVerificationRequestResponseSchema = {
  body: Joi.object({
    status: Joi.string()
      .valid('approved', 'rejected')
      .required()
      .messages({
        'any.only': 'Status must be either "Approved" or "Rejected"',
        'any.required': 'Status is required',
      }),

    review_notes: Joi.string()
      .max(500)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Review notes must not exceed 500 characters',
      }),
  }),

  params: Joi.object({
    requestId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.uuid': 'Request ID must be a valid UUID',
        'any.required': 'Request ID is required',
      }),
  }),
};

export const verificationBadgePaymentSchema = {
  body: Joi.object({
    payment_method: Joi.string().valid('Flutterwave').required(),
    phone_number: Joi.string().required(),
    amount: Joi.number().min(1000).required(),
    currency: Joi.string().valid('UGX', 'USD').required(),
  }),
};
