import Joi from 'joi';

export const initiateRentPaymentSchema = {
  body: Joi.object({
    payment_method: Joi.string()
      .valid('Flutterwave')
      .required()
      .label('Payment Method'),
  }),
};
