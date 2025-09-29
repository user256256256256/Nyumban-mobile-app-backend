import Joi from 'joi';

export const getPaymentParamSchema = {
  params: Joi.object({
    paymentId: Joi.string().uuid().required().label('Payment ID').messages({
      'any.required': 'Payment ID is required',
      'string.uuid': 'Payment ID must be a valid UUID',
    }),
  }),
};
