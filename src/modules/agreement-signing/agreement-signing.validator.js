import Joi from 'joi';

export const acceptAgreementSchema = Joi.object({
  status: Joi.string().required().label('accepted'),
});

export const rentPaymentSchema = Joi.object({
  payment_method: Joi.string().valid('Flutterwave').required()
});

