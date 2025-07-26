import Joi from 'joi';

export const manualRentPaymentSchema = {
  body: Joi.object({
    amount: Joi.number().positive().required().label('Amount').messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be a positive number',
      'any.required': 'Amount is required',
    }),
    method: Joi.string().valid('cash', 'bank_transfer', 'mobile_money').required().label('Payment Method').messages({
      'any.only': 'Method must be one of cash, bank_transfer, or mobile_money',
      'any.required': 'Payment method is required',
    }),
    notes: Joi.string().max(500).optional().allow('', null).label('Notes').messages({
      'string.max': 'Notes must not exceed 500 characters',
    }),
  }),
  params: Joi.object({
    tenantId: Joi.string().uuid().required().label('Tenant ID'),
  }),
  
};
