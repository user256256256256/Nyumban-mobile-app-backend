import Joi from 'joi';

export const initiateRentPaymentSchema = {
  body: Joi.object({
    amount: Joi.number().positive().required().label('Amount'),
    payment_method: Joi.string()
      .valid('Flutterwave', 'MobileMoney')
      .required()
      .label('Payment Method'),
  }),
};

