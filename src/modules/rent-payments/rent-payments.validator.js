import Joi from 'joi';

export const rentPaymentSchema = {
  body: Joi.object({
    amount: Joi.number().positive().required().label('Amount').messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be a positive number',
      'any.required': 'Amount is required',
    }),
    notes: Joi.string().max(500).optional().allow('', null).label('Notes').messages({
      'string.max': 'Notes must not exceed 500 characters',
    }),
  }),
  params: Joi.object({
    agreementId: Joi.string().uuid().required().label('Agreement ID'),
  }),
  
};

export const initialRentPaymentSchema = {
  body: Joi.object({
    amount_paid: Joi.number().positive().required().label('Amount').messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be a positive number',
      'any.required': 'Amount is required',
    }),
    notes: Joi.string().max(500).optional().allow('', null).label('Notes').messages({
      'string.max': 'Notes must not exceed 500 characters',
    }),
  }),
  params: Joi.object({
    agreementId: Joi.string().uuid().required().label('Agreement ID'),
  }),
}