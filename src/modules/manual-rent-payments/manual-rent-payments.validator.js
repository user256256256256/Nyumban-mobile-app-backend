import Joi from 'joi';

export const manualRentPaymentSchema = {
  body: Joi.object({
    amount: Joi.number().positive().required(),
    method: Joi.string().valid('cash', 'bank_transfer', 'mobile_money').required(),
    notes: Joi.string().max(500).optional(),
  }),
};
