import Joi from 'joi';

export const promotionRequestSchema = Joi.object({
  planId: Joi.string().required(),
  paymentMethod: Joi.string().valid('Flutterwave').required(),
  phoneNumber: Joi.string().pattern(/^\+\d{9,15}$/).required(),
});
  