import Joi from 'joi';

export const initiateRentPaymentSchema = {
  body: Joi.object({
    amount: Joi.number().positive().required().label('Amount').messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be a positive value',
      'any.required': 'Amount is required',
    }),
    payment_method: Joi.string().valid('Flutterwave', 'MobileMoney').required().label('Payment Method').messages({
      'any.only': 'Payment method must be either Flutterwave or MobileMoney',
      'any.required': 'Payment method is required',
    }),
  }),
};

export const propertyParamSchema = {
  params: Joi.object({
    propertyId: Joi.string().uuid().required().label('Property ID').messages({
      'string.uuid': 'Property ID must be a valid UUID',
      'any.required': 'Property ID is required',
    }),
  }),
};

export const rentPaymentSchema = {
  params: Joi.object({ agreementId: Joi.string().uuid().required().label('Agreement ID') }),
  body: Joi.object({
    payment_method: Joi.string().valid('Flutterwave').required().label('Payment Method'),
  }),
};
