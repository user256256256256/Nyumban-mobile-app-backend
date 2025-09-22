import Joi from 'joi';

export const draftAgreementSchema = {
  body: Joi.object({
    security_deposit: Joi.number().required(),
    utility_responsibilities: Joi.string().max(100).optional(),
    status: Joi.string().valid('draft', 'ready').required(),
    monthly_rent: Joi.number().positive().required(),
  }),
  params: Joi.object({
    propertyId: Joi.string().uuid().required().label('Property ID'),
  }),
};

export const finalizeAgreementSchema = {
  body: Joi.object({
    status: Joi.string().valid('ready').required(),
  }),
  params: Joi.object({
    propertyId: Joi.string().uuid().required().label('Property ID'),
  }),
};

