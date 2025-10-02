// src/modules/agreement-management-landlord/manual-refund-payments.validator.js
import Joi from 'joi';

export const manualRefundSchema = Joi.object({
  params: Joi.object({
    agreementId: Joi.string().uuid().required().label('Agreement ID'),
  }),
  body: Joi.object({
    action: Joi.string().valid('refund', 'partial_refund', 'forfeit').required(),
    amount: Joi.number().positive().when('action', {
      is: 'partial_refund',
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    notes: Joi.string().allow('').optional(),
  }),
});

export const advanceRentRefundSchema = Joi.object({
  params: Joi.object({
    agreementId: Joi.string().uuid().required().label('Agreement ID'),
  }),
  body: Joi.object({
    notes: Joi.string().allow('').optional(),
  }),
});