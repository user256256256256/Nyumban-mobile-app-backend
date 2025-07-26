import Joi from 'joi';

export const acceptAgreementSchema = {
  params: Joi.object({ agreementId: Joi.string().uuid().required().label('Agreement ID') }),
  body: Joi.object({ status: Joi.string().required().label('Status') }),
};

export const rentPaymentSchema = {
  params: Joi.object({ agreementId: Joi.string().uuid().required().label('Agreement ID') }),
  body: Joi.object({
    payment_method: Joi.string().valid('Flutterwave').required().label('Payment Method'),
  }),
};
