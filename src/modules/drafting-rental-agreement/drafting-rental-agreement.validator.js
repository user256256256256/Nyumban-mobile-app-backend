import Joi from 'joi';

export const draftAgreementSchema = Joi.object({
  security_deposit: Joi.string().required().label('Security Deposit'),
  utility_responsibilities: Joi.string().max(100).optional().label('Utility Responsibilities'),
  status: Joi.string().valid('draft', 'ready').required().label('Agreement Status'),
});

export const finalizeAgreementSchema = Joi.object({ 
  status: Joi.string().valid('ready').required()
})